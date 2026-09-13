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

export default {
  useUserProfile,
  useCaregiverProfile,
  useBookings,
  useBookingDetails,
  useInbox,
  useInboxItem,
  useInboxUnreadCount,
  useWallet,
  useHospitals,
  useHospital,
};
