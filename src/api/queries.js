/**
 * React Query Queries
 * Custom query hooks for data fetching
 */

import {useQuery} from '@tanstack/react-query';
import {
  caregiverService,
  bookingService,
  hospitalService,
  authService,
  inboxService,
  notificationService,
  notificationPreferenceService,
  privacyService,
  conversationService,
  messageService,
} from './services';
import {queryKeys} from './queryKeys';

export const useUserProfile = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.userProfile.current(),
    queryFn: () => authService.getAuthProfile(),
    ...options,
  });
};

export const useCaregiverProfile = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.caregiverProfile.current(),
    queryFn: () => caregiverService.getMyProfile(),
    ...options,
  });
};

export const useBookings = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.bookings.list(params),
    queryFn: () => bookingService.getMyBookings(params),
    ...options,
  });
};

export const useBookingDetails = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingService.getBookingDetails(id),
    enabled: !!id,
    ...options,
  });
};

export const useInbox = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.inbox.list(params),
    queryFn: () => inboxService.getInbox(params),
    ...options,
  });
};

export const useInboxItem = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.inbox.detail(id),
    queryFn: () => inboxService.getInboxItem(id),
    enabled: !!id,
    ...options,
  });
};

export const useInboxUnreadCount = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.inbox.unreadCount(),
    queryFn: () => inboxService.getUnreadCount(),
    refetchInterval: 30000,
    ...options,
  });
};

/** @deprecated Use useInbox */
export const useNotifications = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.inbox.list(params),
    queryFn: () => notificationService.getNotifications(params),
    ...options,
  });
};

export const useWallet = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.wallet.current(params),
    queryFn: () => caregiverService.getWallet(params),
    ...options,
  });
};

export const useAvailability = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.availability.current(),
    queryFn: () => caregiverService.getAvailability(),
    ...options,
  });
};

export const useWithdrawals = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.wallet.withdrawals(params),
    queryFn: () => caregiverService.getWithdrawals(params),
    ...options,
  });
};

export const useDeliveryMethods = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.wallet.deliveryMethods(),
    queryFn: () => caregiverService.getDeliveryMethods(),
    ...options,
  });
};

export const useDeliveryMethodFields = (method, options = {}) => {
  return useQuery({
    queryKey: queryKeys.wallet.deliveryMethod(method),
    queryFn: () => caregiverService.getDeliveryMethodFields(method),
    enabled: !!method,
    ...options,
  });
};

export const useCaregiverReviews = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.reviews.mine(params),
    queryFn: () => caregiverService.getReviews(params),
    ...options,
  });
};

export const useNotificationPreferences = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.notificationPreferences.current(),
    queryFn: () => notificationPreferenceService.getPreferences(),
    ...options,
  });
};

export const useBookingDisputes = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.disputes.list(id),
    queryFn: () => bookingService.getDisputes(id),
    enabled: !!id,
    ...options,
  });
};

export const useHospitals = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.hospitals.lists(),
    queryFn: () => hospitalService.getHospitals(),
    ...options,
  });
};

export const useSearchHospitals = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.hospitals.search(params),
    queryFn: () => hospitalService.searchHospitals(params),
    ...options,
  });
};

export const useHospital = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.hospitals.detail(id),
    queryFn: () => hospitalService.getHospitalDetails(id),
    enabled: !!id,
    ...options,
  });
};

export const usePrivacyPolicy = (role = 'CAREGIVER', options = {}) => {
  return useQuery({
    queryKey: queryKeys.privacy.byRole(role),
    queryFn: () => privacyService.getByRole(role),
    ...options,
  });
};

export const useConversations = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.conversations.list(params),
    queryFn: () => conversationService.getMyConversations(params),
    ...options,
  });
};

export const useConversation = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.conversations.detail(id),
    queryFn: () => conversationService.getConversation(id),
    enabled: !!id,
    ...options,
  });
};

export const useConversationUnreadCount = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.conversations.unreadCount(),
    queryFn: () => conversationService.getUnreadCount(),
    refetchInterval: 30000,
    ...options,
  });
};

export const useMessages = (conversationId, params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.messages.list(conversationId, params),
    queryFn: () => messageService.getMessages(conversationId, params),
    enabled: !!conversationId,
    ...options,
  });
};

export default {
  useUserProfile,
  useCaregiverProfile,
  useBookings,
  useBookingDetails,
  useInbox,
  useInboxItem,
  useInboxUnreadCount,
  useWallet,
  useAvailability,
  useWithdrawals,
  useDeliveryMethods,
  useDeliveryMethodFields,
  useCaregiverReviews,
  useNotificationPreferences,
  useBookingDisputes,
  useHospitals,
  useHospital,
  usePrivacyPolicy,
  useConversations,
  useConversation,
  useConversationUnreadCount,
  useMessages,
};
