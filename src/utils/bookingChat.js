import {useSyncExternalStore} from 'react';
import {queryKeys} from '../api/queryKeys';
import {
  addRealtimeListener,
  getTrackingState,
  stopLiveTracking,
} from '../services/liveTrackingService';

export const CHAT_ENDED_MESSAGE =
  'Service has ended. This chat is closed and messages have been deleted.';

// In-memory only: nothing about a booking chat is persisted on the device.
const unreadByBooking = new Map();
const countedIdsByBooking = new Map();
const storeListeners = new Set();
const eventListeners = new Set();
let focusedBookingId = null;

const key = bookingId => (bookingId ? String(bookingId) : '');

const notifyStore = () => {
  storeListeners.forEach(listener => listener());
};

export const bookingChatStore = {
  subscribe(listener) {
    storeListeners.add(listener);
    return () => storeListeners.delete(listener);
  },
  getUnread(bookingId) {
    return unreadByBooking.get(key(bookingId)) || 0;
  },
  setUnread(bookingId, count) {
    const id = key(bookingId);
    const next = Math.max(0, Number(count) || 0);
    if (!id || unreadByBooking.get(id) === next) {
      return;
    }
    unreadByBooking.set(id, next);
    notifyStore();
  },
  /** Counts a message once even if it arrives via both socket and push. */
  bumpUnread(bookingId, messageId) {
    const id = key(bookingId);
    if (!id) {
      return;
    }
    if (messageId) {
      const counted = countedIdsByBooking.get(id) || new Set();
      if (counted.has(String(messageId))) {
        return;
      }
      counted.add(String(messageId));
      countedIdsByBooking.set(id, counted);
    }
    unreadByBooking.set(id, (unreadByBooking.get(id) || 0) + 1);
    notifyStore();
  },
  clear(bookingId) {
    const id = key(bookingId);
    countedIdsByBooking.delete(id);
    if (unreadByBooking.has(id)) {
      unreadByBooking.delete(id);
      notifyStore();
    }
  },
  setFocused(bookingId) {
    focusedBookingId = bookingId ? key(bookingId) : null;
  },
  isFocused(bookingId) {
    return Boolean(focusedBookingId) && focusedBookingId === key(bookingId);
  },
};

export const useBookingChatUnread = bookingId =>
  useSyncExternalStore(bookingChatStore.subscribe, () =>
    bookingChatStore.getUnread(bookingId),
  );

/** type: 'refresh' (push arrived while chat open) | 'ended' */
export const bookingChatEvents = {
  emit(type, bookingId) {
    eventListeners.forEach(listener => {
      try {
        listener(type, key(bookingId));
      } catch (error) {
        console.error('Booking chat listener failed:', error);
      }
    });
  },
  subscribe(listener) {
    eventListeners.add(listener);
    return () => eventListeners.delete(listener);
  },
};

export const isOwnBookingMessage = message =>
  String(message?.sender_role || '').toUpperCase() === 'CAREGIVER' ||
  Boolean(message?.pending);

export const isBookingChatPush = data => {
  const type = String(data?.type || data?.event || '').toUpperCase();
  const action = String(data?.action || '').toUpperCase();
  const screen = String(data?.screen || '').toLowerCase();
  return (
    type === 'BOOKING_CHAT_MESSAGE' ||
    action === 'OPEN_BOOKING_CHAT' ||
    screen === 'booking_chat'
  );
};

export const isChatClosedError = error =>
  String(error?.code || '').toUpperCase() === 'CHAT_CLOSED';

export const messagePreview = message => {
  if (!message) {
    return '';
  }
  const text = String(message.message || '').trim();
  if (text) {
    return text;
  }
  if (message.message_type === 'image') {
    return 'Photo';
  }
  if (message.message_type === 'document') {
    return message.attachment_name || 'Document';
  }
  return '';
};

const patchBookingDetail = (queryClient, bookingId, patch) => {
  queryClient.setQueryData(queryKeys.bookings.detail(bookingId), current => {
    if (!current?.data || typeof current.data !== 'object') {
      return current;
    }
    return {...current, data: patch(current.data)};
  });
};

export const patchChatPreview = (queryClient, message) => {
  if (!message?.booking_id) {
    return;
  }
  patchBookingDetail(queryClient, message.booking_id, booking =>
    booking.chat
      ? {
          ...booking,
          chat: {
            ...booking.chat,
            last_message: {
              id: message.id,
              message: messagePreview(message),
              sender_role: message.sender_role,
              created_at: message.created_at,
            },
          },
        }
      : booking,
  );
};

/**
 * Service ended (End service, chat:ended, 409 CHAT_CLOSED, or is_active=false):
 * drop all local chat state for the booking and refetch it so can_chat=false.
 */
export const endBookingChat = (queryClient, bookingId) => {
  if (!bookingId) {
    return;
  }
  bookingChatStore.clear(bookingId);
  patchBookingDetail(queryClient, bookingId, booking => ({
    ...booking,
    can_chat: false,
    chat: null,
  }));
  queryClient.invalidateQueries({queryKey: queryKeys.bookings.all});
  bookingChatEvents.emit('ended', bookingId);
};

/** App-wide socket handlers for badges / previews / ended. Returns cleanup. */
export const registerBookingChatSocket = queryClient => {
  const offMessage = addRealtimeListener('chat:message', message => {
    if (!message?.booking_id) {
      return;
    }
    patchChatPreview(queryClient, message);
    const incoming =
      String(message.sender_role || '').toUpperCase() !== 'CAREGIVER';
    if (incoming && !bookingChatStore.isFocused(message.booking_id)) {
      bookingChatStore.bumpUnread(message.booking_id, message.id);
    }
  });

  const offEnded = addRealtimeListener('chat:ended', payload => {
    const bookingId = payload?.booking_id;
    if (!bookingId) {
      return;
    }
    endBookingChat(queryClient, bookingId);
    if (String(getTrackingState().bookingId) === String(bookingId)) {
      stopLiveTracking().catch(() => {});
    }
  });

  return () => {
    offMessage();
    offEnded();
  };
};
