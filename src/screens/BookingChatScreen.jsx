import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Image,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  StatusBar,
  AppState,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {
  pick,
  types,
  errorCodes,
  isErrorWithCode,
} from '@react-native-documents/picker';
import {bookingChatService, unwrapData, unwrapList} from '../api/services';
import {queryKeys} from '../api/queryKeys';
import {useBookingDetails} from '../api/queries';
import {showError} from '../context/ErrorModalContext';
import {showAlert} from '../context/AlertModalContext';
import Toast from '../components/common/Toast';
import ChatWallpaper from '../components/chat/ChatWallpaper';
import {
  MessageBubble,
  AttachSheet,
  ImageViewer,
  PdfViewer,
  PersonAvatar,
  CHAT_COLORS,
} from '../components/chat/ChatParts';
import {
  requestCameraPermission,
  requestGalleryPermission,
} from '../utils/permissions';
import {
  createClientMessageId,
  formatFileSize,
  mergeMessages,
  buildChatRows,
  normalizeAttachment,
  validateAttachment,
  newestServerMessage,
  oldestServerMessage,
} from '../utils/supportChat';
import {
  CHAT_ENDED_MESSAGE,
  bookingChatEvents,
  bookingChatStore,
  endBookingChat,
  isChatClosedError,
  isOwnBookingMessage,
  patchChatPreview,
} from '../utils/bookingChat';
import {
  addRealtimeListener,
  ensureRealtimeSocket,
  getRealtimeSocket,
} from '../services/liveTrackingService';

const {TEAL, INK, MUTED, WALL} = CHAT_COLORS;
const MAX_TEXT = 4000;
const PAGE_SIZE = 30;
const ACK_TIMEOUT_MS = 10000;
const TYPING_THROTTLE_MS = 2500;
const TYPING_IDLE_MS = 4000;
const TYPING_HIDE_MS = 5000;
const QUICK_REPLIES = [
  'On my way',
  'Reached the hospital',
  'Patient is resting',
  'Medicine given',
];

const imagePickerOptions = {
  mediaType: 'photo',
  quality: 0.8,
  selectionLimit: 1,
  maxWidth: 1600,
  maxHeight: 1600,
};

const sameBooking = (a, b) => Boolean(a) && String(a) === String(b);

const isIncoming = message =>
  String(message?.sender_role || '').toUpperCase() !== 'CAREGIVER';

function markChatSeen(queryClient, bookingId) {
  bookingChatStore.clear(bookingId);
  queryClient.setQueryData(queryKeys.bookings.detail(bookingId), current =>
    current?.data?.chat
      ? {
          ...current,
          data: {
            ...current.data,
            chat: {...current.data.chat, unread_count: 0},
          },
        }
      : current,
  );
}

const BookingChatScreen = ({navigation, route}) => {
  const {bookingId} = route.params || {};
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const {data: bookingData} = useBookingDetails(bookingId);
  const booking = bookingData?.data || null;

  const listRef = useRef(null);
  const messagesRef = useRef([]);
  const hasMoreRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const userScrolledRef = useRef(false);
  const listHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const latestGenRef = useRef(0);
  const endedRef = useRef(false);
  const typingHideRef = useRef(null);
  const typingIdleRef = useRef(null);
  const lastTypingEmitRef = useRef(0);

  const [messages, setMessages] = useState([]);
  const [chatMeta, setChatMeta] = useState(null);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [counterpartTyping, setCounterpartTyping] = useState(false);
  const [toast, setToast] = useState({visible: false, message: ''});

  messagesRef.current = messages;

  const chat = chatMeta || booking?.chat || null;
  const counterpart = chat?.counterpart || null;
  const counterpartName =
    counterpart?.name || booking?.customer_name || booking?.user?.name || 'Customer';
  const bookingNumber = chat?.booking_number || booking?.booking_number || '';

  const rows = useMemo(
    () => buildChatRows(messages, isOwnBookingMessage),
    [messages],
  );
  const canSend = Boolean(draft.trim() || attachment);

  useEffect(() => {
    return bookingChatEvents.subscribe((type, id) => {
      if (type !== 'ended' || !sameBooking(id, bookingId) || endedRef.current) {
        return;
      }
      endedRef.current = true;
      setMessages([]);
      setDraft('');
      setAttachment(null);
      showAlert('Chat closed', CHAT_ENDED_MESSAGE);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('BookingDetails', {bookingId});
      }
    });
  }, [bookingId, navigation]);

  const closeChat = useCallback(() => {
    endBookingChat(queryClient, bookingId);
  }, [bookingId, queryClient]);

  /** Returns true when the error was fully handled (chat closed). */
  const handleChatError = useCallback(
    (error, {silent = false} = {}) => {
      if (isChatClosedError(error)) {
        closeChat();
        return true;
      }
      if (silent) {
        return false;
      }
      if (error?.status === 403) {
        showError('This booking is not assigned to you.');
      } else if (error?.status === 400) {
        showError(error.message || 'Something went wrong');
      }
      return false;
    },
    [closeChat],
  );

  /** Returns false when the server says the chat is no longer active. */
  const applyMeta = useCallback(
    response => {
      const meta = response?.meta?.chat;
      if (meta && meta.is_active === false) {
        closeChat();
        return false;
      }
      if (meta) {
        setChatMeta(prev => ({...(prev || {}), ...meta}));
      }
      return true;
    },
    [closeChat],
  );

  const rememberPage = useCallback((response, {replaceOlderFlag}) => {
    const incoming = unwrapList(response);
    setMessages(prev => mergeMessages(prev, incoming));
    if (replaceOlderFlag) {
      const more = Boolean(response?.meta?.has_more);
      hasMoreRef.current = more;
      setHasMore(more);
    }
  }, []);

  const markRead = useCallback(() => {
    const socket = getRealtimeSocket();
    if (socket?.connected) {
      socket.emit('chat:read', {booking_id: bookingId});
    } else {
      bookingChatService.markAsRead(bookingId).catch(error => {
        handleChatError(error, {silent: true});
      });
    }
    markChatSeen(queryClient, bookingId);
  }, [bookingId, handleChatError, queryClient]);

  const loadLatest = useCallback(async () => {
    if (!bookingId || endedRef.current) {
      return;
    }
    const gen = latestGenRef.current + 1;
    latestGenRef.current = gen;
    try {
      const response = await bookingChatService.getMessages(bookingId, {
        limit: PAGE_SIZE,
      });
      if (gen !== latestGenRef.current || !applyMeta(response)) {
        return;
      }
      rememberPage(response, {replaceOlderFlag: true});
      markChatSeen(queryClient, bookingId);
      setLoadError('');
    } catch (error) {
      if (gen !== latestGenRef.current || handleChatError(error)) {
        return;
      }
      setLoadError(error?.message || 'Could not load messages. Pull to try again.');
    } finally {
      if (gen === latestGenRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [applyMeta, bookingId, handleChatError, queryClient, rememberPage]);

  const loadNewer = useCallback(async () => {
    if (endedRef.current) {
      return;
    }
    const newest = newestServerMessage(messagesRef.current);
    if (!newest?.id) {
      await loadLatest();
      return;
    }
    try {
      const response = await bookingChatService.getMessages(bookingId, {
        after: newest.id,
      });
      if (!applyMeta(response)) {
        return;
      }
      rememberPage(response, {replaceOlderFlag: false});
      if (unwrapList(response).some(isIncoming)) {
        await bookingChatService.markAsRead(bookingId).catch(() => {});
      }
      markChatSeen(queryClient, bookingId);
      setLoadError('');
    } catch (error) {
      if (!handleChatError(error, {silent: true})) {
        await loadLatest();
      }
    }
  }, [applyMeta, bookingId, handleChatError, loadLatest, queryClient, rememberPage]);

  const loadOlder = useCallback(async () => {
    const oldest = oldestServerMessage(messagesRef.current);
    if (
      !oldest?.id ||
      !hasMoreRef.current ||
      loadingOlderRef.current ||
      !userScrolledRef.current
    ) {
      return;
    }
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const response = await bookingChatService.getMessages(bookingId, {
        before: oldest.id,
        limit: PAGE_SIZE,
      });
      if (applyMeta(response)) {
        rememberPage(response, {replaceOlderFlag: true});
      }
    } catch (error) {
      handleChatError(error);
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [applyMeta, bookingId, handleChatError, rememberPage]);

  const loadOlderRef = useRef(loadOlder);
  loadOlderRef.current = loadOlder;

  const fillOlderIfShort = useCallback(() => {
    if (
      listHeightRef.current > 0 &&
      contentHeightRef.current > 0 &&
      contentHeightRef.current <= listHeightRef.current + 24
    ) {
      userScrolledRef.current = true;
      loadOlderRef.current();
    }
  }, []);

  const stopTyping = useCallback(() => {
    clearTimeout(typingIdleRef.current);
    if (!lastTypingEmitRef.current) {
      return;
    }
    lastTypingEmitRef.current = 0;
    const socket = getRealtimeSocket();
    if (socket?.connected) {
      socket.emit('chat:typing', {booking_id: bookingId, is_typing: false});
    }
  }, [bookingId]);

  const handlersRef = useRef({});
  handlersRef.current = {
    onMessage: message => {
      if (!sameBooking(message?.booking_id, bookingId)) {
        return;
      }
      setMessages(prev => mergeMessages(prev, [message]));
      if (isIncoming(message)) {
        setCounterpartTyping(false);
        markRead();
      }
    },
    onRead: payload => {
      if (
        !sameBooking(payload?.booking_id, bookingId) ||
        String(payload?.reader_role || '').toUpperCase() !== 'USER'
      ) {
        return;
      }
      setMessages(prev =>
        prev.map(item =>
          !item.pending && !isIncoming(item)
            ? {...item, is_read: true, read_at: item.read_at || payload.read_at}
            : item,
        ),
      );
    },
    onTyping: payload => {
      if (
        !sameBooking(payload?.booking_id, bookingId) ||
        String(payload?.sender_role || '').toUpperCase() === 'CAREGIVER'
      ) {
        return;
      }
      clearTimeout(typingHideRef.current);
      const typing = Boolean(payload?.is_typing);
      setCounterpartTyping(typing);
      if (typing) {
        typingHideRef.current = setTimeout(
          () => setCounterpartTyping(false),
          TYPING_HIDE_MS,
        );
      }
    },
    onError: payload => {
      if (isChatClosedError(payload)) {
        closeChat();
        return;
      }
      if (payload?.message) {
        setToast({visible: true, message: payload.message});
      }
    },
    onReconnect: () => {
      loadNewer();
    },
  };

  useFocusEffect(
    useCallback(() => {
      bookingChatStore.setFocused(bookingId);
      ensureRealtimeSocket().catch(() => {});
      const offs = [
        addRealtimeListener('chat:message', m => handlersRef.current.onMessage(m)),
        addRealtimeListener('chat:read', p => handlersRef.current.onRead(p)),
        addRealtimeListener('chat:typing', p => handlersRef.current.onTyping(p)),
        addRealtimeListener('chat:error', p => handlersRef.current.onError(p)),
        addRealtimeListener('connect', () => handlersRef.current.onReconnect()),
      ];
      const offEvents = bookingChatEvents.subscribe((type, id) => {
        if (type === 'refresh' && sameBooking(id, bookingId)) {
          loadNewer();
        }
      });
      loadLatest();
      const appStateSub = AppState.addEventListener('change', state => {
        if (state === 'active') {
          ensureRealtimeSocket().catch(() => {});
          loadLatest();
        }
      });
      const showEvent =
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent =
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
      const showSub = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
      const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));
      return () => {
        bookingChatStore.setFocused(null);
        stopTyping();
        clearTimeout(typingHideRef.current);
        offs.forEach(off => off());
        offEvents();
        appStateSub.remove();
        showSub.remove();
        hideSub.remove();
      };
    }, [bookingId, loadLatest, loadNewer, stopTyping]),
  );

  const scrollToLatest = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({offset: 0, animated: true});
    });
  }, []);

  const sendTextViaSocket = useCallback(
    (text, clientId) =>
      new Promise((resolve, reject) => {
        const socket = getRealtimeSocket();
        const fallback = () => {
          const error = new Error('Socket unavailable');
          error.fallbackToRest = true;
          reject(error);
        };
        if (!socket?.connected) {
          fallback();
          return;
        }
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            fallback();
          }
        }, ACK_TIMEOUT_MS);
        socket.emit(
          'chat:send',
          {booking_id: bookingId, message: text, client_message_id: clientId},
          ack => {
            if (settled) {
              return;
            }
            settled = true;
            clearTimeout(timer);
            if (ack?.ok && ack?.data?.id) {
              resolve(ack.data);
              return;
            }
            const error = new Error(ack?.message || 'Could not send message');
            error.code = ack?.code || null;
            error.status = 400;
            reject(error);
          },
        );
      }),
    [bookingId],
  );

  const deliver = useCallback(
    async optimistic => {
      const clientId = optimistic.client_message_id;
      try {
        let saved;
        if (optimistic.localFile) {
          const response = await bookingChatService.sendFile(bookingId, {
            file: optimistic.localFile,
            message: optimistic.message,
            clientMessageId: clientId,
            onProgress: percent => {
              setMessages(prev =>
                prev.map(item =>
                  item.client_message_id === clientId
                    ? {...item, uploadProgress: percent}
                    : item,
                ),
              );
            },
          });
          saved = unwrapData(response);
        } else {
          try {
            saved = await sendTextViaSocket(optimistic.message, clientId);
          } catch (socketError) {
            if (!socketError?.fallbackToRest) {
              throw socketError;
            }
            const response = await bookingChatService.sendText(bookingId, {
              message: optimistic.message,
              clientMessageId: clientId,
            });
            saved = unwrapData(response);
          }
        }
        if (!saved?.id) {
          throw new Error('Could not send message');
        }
        const confirmed = {
          ...saved,
          client_message_id: saved.client_message_id || clientId,
        };
        setMessages(prev => mergeMessages(prev, [confirmed]));
        patchChatPreview(queryClient, {booking_id: bookingId, ...confirmed});
      } catch (error) {
        if (handleChatError(error)) {
          return;
        }
        setMessages(prev =>
          prev.map(item =>
            item.client_message_id === clientId
              ? {...item, pending: true, localStatus: 'failed'}
              : item,
          ),
        );
      }
    },
    [bookingId, handleChatError, queryClient, sendTextViaSocket],
  );

  const submit = useCallback(
    (text, file) => {
      if (endedRef.current || (!text && !file)) {
        return;
      }
      if (text.length > MAX_TEXT) {
        showError('Message is too long. Maximum is 4000 characters.');
        return;
      }
      stopTyping();
      const clientId = createClientMessageId();
      const optimistic = {
        id: clientId,
        booking_id: bookingId,
        client_message_id: clientId,
        sender_role: 'CAREGIVER',
        sender_name: 'You',
        message_type: file ? (file.kind === 'pdf' ? 'document' : 'image') : 'text',
        message: text || null,
        attachment_url: file?.uri || null,
        attachment_name: file?.name || null,
        attachment_mime: file?.mime || null,
        attachment_size: file?.size || null,
        localFile: file || undefined,
        created_at: new Date().toISOString(),
        pending: true,
        localStatus: 'sending',
        uploadProgress: file ? 0 : null,
        is_read: false,
      };
      setMessages(prev =>
        mergeMessages(
          [...prev.filter(item => item.client_message_id !== clientId), optimistic],
          [],
        ),
      );
      scrollToLatest();
      deliver(optimistic);
    },
    [bookingId, deliver, scrollToLatest, stopTyping],
  );

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text && !attachment) {
      return;
    }
    submit(text, attachment);
    setDraft('');
    setAttachment(null);
  }, [attachment, draft, submit]);

  const handleDraftChange = useCallback(
    text => {
      setDraft(text);
      const socket = getRealtimeSocket();
      if (!socket?.connected) {
        return;
      }
      if (!text.trim()) {
        stopTyping();
        return;
      }
      const now = Date.now();
      if (now - lastTypingEmitRef.current > TYPING_THROTTLE_MS) {
        socket.emit('chat:typing', {booking_id: bookingId, is_typing: true});
        lastTypingEmitRef.current = now;
      }
      clearTimeout(typingIdleRef.current);
      typingIdleRef.current = setTimeout(stopTyping, TYPING_IDLE_MS);
    },
    [bookingId, stopTyping],
  );

  const retryMessage = useCallback(
    message => {
      if (message?.localStatus !== 'failed') {
        return;
      }
      setMessages(prev =>
        prev.map(item =>
          item.client_message_id === message.client_message_id
            ? {
                ...item,
                localStatus: 'sending',
                uploadProgress: item.localFile ? 0 : null,
              }
            : item,
        ),
      );
      deliver({...message, localStatus: 'sending', pending: true});
    },
    [deliver],
  );

  const stageFile = useCallback(asset => {
    const file = normalizeAttachment(asset);
    const problem = validateAttachment(file);
    if (problem) {
      showError(problem);
      return;
    }
    setAttachment(file);
    setAttachOpen(false);
  }, []);

  const openCamera = useCallback(async () => {
    setAttachOpen(false);
    const granted = await requestCameraPermission();
    if (!granted) {
      showError('Please allow camera access to take a photo.', 'Permission required');
      return;
    }
    const result = await launchCamera(imagePickerOptions);
    if (result?.didCancel) {
      return;
    }
    if (result?.errorCode) {
      showError(result.errorMessage || 'Could not open the camera');
      return;
    }
    if (result?.assets?.[0]?.uri) {
      stageFile(result.assets[0]);
    }
  }, [stageFile]);

  const openGallery = useCallback(async () => {
    setAttachOpen(false);
    const granted = await requestGalleryPermission();
    if (!granted) {
      showError(
        'Please allow photo library access to send an image.',
        'Permission required',
      );
      return;
    }
    const result = await launchImageLibrary(imagePickerOptions);
    if (result?.didCancel) {
      return;
    }
    if (result?.errorCode) {
      showError(result.errorMessage || 'Could not open your photos');
      return;
    }
    if (result?.assets?.[0]?.uri) {
      stageFile(result.assets[0]);
    }
  }, [stageFile]);

  const openDocument = useCallback(async () => {
    setAttachOpen(false);
    try {
      const [file] = await pick({type: [types.pdf], allowMultiSelection: false});
      if (file?.uri) {
        stageFile(file);
      }
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      showError(error?.message || 'Could not open documents');
    }
  }, [stageFile]);

  const openImage = useCallback(message => {
    const uri = message?.attachment_url;
    if (!uri || message.localStatus === 'failed') {
      return;
    }
    setViewer({uri});
  }, []);

  const openPdf = useCallback(message => {
    const uri = message?.attachment_url;
    if (!uri || message.pending || !/^https?:/i.test(uri)) {
      return;
    }
    setPdf({uri, name: message.attachment_name || 'Document'});
  }, []);

  const avatar = useMemo(
    () => <PersonAvatar photo={counterpart?.photo} name={counterpartName} size={28} />,
    [counterpart?.photo, counterpartName],
  );

  const renderItem = useCallback(
    ({item}) => {
      if (item.type === 'date') {
        return (
          <View style={styles.dateWrap}>
            <Text style={styles.dateText}>{item.label}</Text>
          </View>
        );
      }
      return (
        <MessageBubble
          message={item.message}
          own={isOwnBookingMessage(item.message)}
          avatar={avatar}
          showAvatar={item.showAvatar}
          onRetry={retryMessage}
          onOpenImage={openImage}
          onOpenPdf={openPdf}
        />
      );
    },
    [avatar, openImage, openPdf, retryMessage],
  );

  const composerPad = keyboardOpen ? 8 : Math.max(insets.bottom, 10);
  const headerSub = counterpartTyping
    ? `${counterpartName} is typing…`
    : bookingNumber
      ? `Booking ${bookingNumber}`
      : 'Customer';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type="error"
        onHide={() => setToast(prev => ({...prev, visible: false}))}
      />
      <View style={[styles.header, {paddingTop: Math.max(insets.top, 8)}]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Icon name="arrow-back" size={22} color={INK} />
        </Pressable>
        <View style={styles.headerAvatar}>
          <PersonAvatar photo={counterpart?.photo} name={counterpartName} size={40} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {counterpartName}
          </Text>
          <Text
            style={[styles.headerSub, counterpartTyping && styles.headerTyping]}
            numberOfLines={1}>
            {headerSub}
          </Text>
        </View>
      </View>
      <View style={styles.notice}>
        <Icon name="time-outline" size={13} color="#8A6D3B" />
        <Text style={styles.noticeText}>
          Messages are deleted when the service ends.
        </Text>
      </View>

      <ChatWallpaper>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {initialLoading ? (
            <View style={styles.centerFill}>
              <ActivityIndicator size="large" color={TEAL} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              style={styles.flex}
              data={rows}
              inverted
              keyExtractor={item => item.id}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              onScrollBeginDrag={() => {
                userScrolledRef.current = true;
              }}
              onLayout={event => {
                listHeightRef.current = event.nativeEvent.layout.height;
                fillOlderIfShort();
              }}
              onContentSizeChange={(_width, height) => {
                contentHeightRef.current = height;
                fillOlderIfShort();
              }}
              contentContainerStyle={
                rows.length === 0 ? styles.emptyContent : styles.listContent
              }
              onEndReached={loadOlder}
              onEndReachedThreshold={0.2}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 120,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    loadLatest();
                  }}
                  tintColor={TEAL}
                  colors={[TEAL]}
                />
              }
              ListFooterComponent={
                loadingOlder ? (
                  <ActivityIndicator style={styles.olderSpinner} color={TEAL} size="small" />
                ) : hasMore ? (
                  <View style={styles.olderSpacer} />
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Icon name="chatbubbles" size={28} color={TEAL} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {loadError
                      ? 'Could not load messages'
                      : `Say hello to ${counterpartName}. You can share updates, photos or documents during the service.`}
                  </Text>
                  {loadError ? (
                    <Pressable onPress={loadLatest} style={styles.retryLink}>
                      <Text style={styles.retryLinkText}>Tap to retry</Text>
                    </Pressable>
                  ) : null}
                </View>
              }
            />
          )}

          {!attachment ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.quickWrap}
              contentContainerStyle={styles.quickRow}>
              {QUICK_REPLIES.map(reply => (
                <Pressable
                  key={reply}
                  onPress={() => submit(reply, null)}
                  style={styles.quickChip}>
                  <Text style={styles.quickText}>{reply}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.previewBar}>
              {attachment.kind === 'image' ? (
                <Image source={{uri: attachment.uri}} style={styles.previewImage} />
              ) : (
                <View style={styles.previewDoc}>
                  <Icon name="document-text" size={22} color="#E14D4D" />
                </View>
              )}
              <View style={styles.previewCopy}>
                <Text style={styles.previewName} numberOfLines={1}>
                  {attachment.name}
                </Text>
                <Text style={styles.previewMeta}>
                  {attachment.kind === 'pdf' ? 'PDF' : 'Photo'}
                  {attachment.size ? ` · ${formatFileSize(attachment.size)}` : ''}
                </Text>
              </View>
              <Pressable
                onPress={() => setAttachment(null)}
                hitSlop={8}
                style={styles.previewClose}>
                <Icon name="close" size={18} color={INK} />
              </Pressable>
            </View>
          )}

          <View style={[styles.composer, {paddingBottom: composerPad}]}>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setAttachOpen(true);
              }}
              style={styles.attachBtn}
              accessibilityLabel="Attach file">
              <Icon name="add" size={26} color={TEAL} />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={handleDraftChange}
              onBlur={stopTyping}
              placeholder={attachment ? 'Add a caption' : 'Message'}
              placeholderTextColor="#8AA0A6"
              style={styles.input}
              multiline
              maxLength={MAX_TEXT}
            />
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              accessibilityLabel="Send message">
              <Icon name="send" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ChatWallpaper>

      <AttachSheet
        visible={attachOpen}
        onClose={() => setAttachOpen(false)}
        onCamera={openCamera}
        onGallery={openGallery}
        onDocument={openDocument}
      />
      <ImageViewer uri={viewer?.uri} onClose={() => setViewer(null)} topInset={insets.top} />
      <PdfViewer file={pdf} onClose={() => setPdf(null)} topInset={insets.top} />
    </View>
  );
};

export default BookingChatScreen;

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: WALL},
  flex: {flex: 1},
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  backBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  headerAvatar: {marginRight: 10},
  headerCopy: {flex: 1, minWidth: 0},
  headerTitle: {fontSize: 16, fontWeight: '700', color: INK},
  headerSub: {marginTop: 1, fontSize: 12, color: MUTED},
  headerTyping: {color: TEAL, fontStyle: 'italic'},
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 5,
    backgroundColor: '#FFF6DD',
  },
  noticeText: {fontSize: 12, color: '#8A6D3B', fontWeight: '500'},
  centerFill: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  listContent: {paddingHorizontal: 10, paddingVertical: 8},
  emptyContent: {flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28},
  emptyState: {alignItems: 'center', justifyContent: 'center', paddingVertical: 24},
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
    fontWeight: '500',
  },
  retryLink: {marginTop: 12},
  retryLinkText: {color: TEAL, fontWeight: '700', fontSize: 14},
  olderSpinner: {marginVertical: 12},
  olderSpacer: {height: 8},
  dateWrap: {alignItems: 'center', marginVertical: 8},
  dateText: {
    backgroundColor: '#FFFFFF',
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickWrap: {flexGrow: 0},
  quickRow: {paddingHorizontal: 10, paddingTop: 6, gap: 6},
  quickChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CFE7E4',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickText: {fontSize: 13, color: TEAL, fontWeight: '600'},
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginTop: 4,
    borderRadius: 14,
    padding: 8,
  },
  previewImage: {width: 48, height: 48, borderRadius: 10, backgroundColor: '#E7EEF0'},
  previewDoc: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCopy: {flex: 1, marginHorizontal: 10},
  previewName: {fontSize: 14, fontWeight: '600', color: INK},
  previewMeta: {marginTop: 2, fontSize: 12, color: MUTED},
  previewClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 6,
    backgroundColor: 'transparent',
    gap: 6,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 11 : 8,
    paddingBottom: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 16,
    color: INK,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {backgroundColor: '#C5CED6'},
});
