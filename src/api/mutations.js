/**
 * React Query Mutations
 * Custom mutation hooks for data mutations
 */

import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  bookingService,
  authService,
  inboxService,
  caregiverService,
  notificationPreferenceService,
} from './services';
import {queryKeys} from './queryKeys';

const invalidateBookings = (queryClient, id) => {
  queryClient.invalidateQueries({queryKey: queryKeys.bookings.all});
  queryClient.invalidateQueries({queryKey: queryKeys.wallet.all});
  queryClient.invalidateQueries({queryKey: queryKeys.inbox.all});
  if (id) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.bookings.detail(id),
    });
  }
};

export const useAcceptBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: id => bookingService.acceptBooking(id),
    onSuccess: (_data, id) => {
      invalidateBookings(queryClient, id);
    },
  });
};

export const useRejectBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, reason}) => bookingService.rejectBooking(id, reason),
    onSuccess: (_data, variables) => {
      invalidateBookings(queryClient, variables?.id);
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: variables => {
      const id = typeof variables === 'object' ? variables.id : variables;
      const reason =
        typeof variables === 'object' ? variables.reason : 'Emergency';
      return bookingService.cancelBooking(id, reason);
    },
    onSuccess: (_data, variables) => {
      const id = typeof variables === 'object' ? variables.id : variables;
      invalidateBookings(queryClient, id);
    },
  });
};

export const useStartBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: variables => {
      const id = typeof variables === 'object' ? variables.id : variables;
      const location =
        typeof variables === 'object' ? variables.location || {} : {};
      return bookingService.startBooking(id, location);
    },
    onSuccess: (_data, variables) => {
      const id = typeof variables === 'object' ? variables.id : variables;
      invalidateBookings(queryClient, id);
    },
  });
};

export const useCompleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: id => bookingService.completeBooking(id),
    onSuccess: (_data, id) => {
      invalidateBookings(queryClient, id);
    },
  });
};

export const useMarkInboxRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: id => inboxService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.inbox.all});
    },
  });
};

export const useMarkAllInboxRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => inboxService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.inbox.all});
    },
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({email, password}) => authService.login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.auth.all});
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({name, email, password}) =>
      authService.register(name, email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.auth.all});
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payload => authService.updateAuthProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.userProfile.current()});
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({currentPassword, newPassword}) =>
      authService.changePassword(currentPassword, newPassword),
  });
};

export const useUploadProfilePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: formData => authService.uploadProfilePhoto(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.userProfile.current()});
    },
  });
};

export const useUpdateAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: slots => caregiverService.updateAvailability(slots),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.availability.all});
      queryClient.invalidateQueries({queryKey: queryKeys.caregiverProfile.all});
    },
  });
};

export const useCreateWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payload => caregiverService.createWithdrawal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.wallet.all});
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payload =>
      notificationPreferenceService.updatePreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationPreferences.all,
      });
    },
  });
};

export const useCreateDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, reason, details}) =>
      bookingService.createDispute(id, {
        reason,
        ...(details ? {details} : {}),
      }),
    onSuccess: (_data, variables) => {
      invalidateBookings(queryClient, variables?.id);
      queryClient.invalidateQueries({
        queryKey: queryKeys.disputes.list(variables?.id),
      });
    },
  });
};

export const useCreateCaregiverProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({fields, photoAsset}) =>
      caregiverService.createProfile(fields, photoAsset),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.caregiverProfile.all});
    },
  });
};

export const useUpdateCaregiverProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({fields, photoAsset}) =>
      caregiverService.updateProfile(fields, photoAsset),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.caregiverProfile.all});
    },
  });
};

export default {
  useAcceptBooking,
  useRejectBooking,
  useCancelBooking,
  useStartBooking,
  useCompleteBooking,
  useMarkInboxRead,
  useMarkAllInboxRead,
  useLogin,
  useRegister,
  useUpdateProfile,
  useChangePassword,
  useUploadProfilePhoto,
  useCreateCaregiverProfile,
  useUpdateCaregiverProfile,
  useUpdateAvailability,
  useCreateWithdrawal,
  useUpdateNotificationPreferences,
  useCreateDispute,
};
