/**
 * React Query Keys
 * Centralized query key factory for cache management
 */

export const queryKeys = {
  auth: {
    all: ['auth'],
    user: () => ['auth', 'user'],
  },

  userProfile: {
    all: ['userProfile'],
    current: () => ['userProfile', 'current'],
  },

  caregiverProfile: {
    all: ['caregiverProfile'],
    current: () => ['caregiverProfile', 'current'],
  },

  bookings: {
    all: ['bookings'],
    lists: () => ['bookings', 'list'],
    list: filters => ['bookings', 'list', filters],
    details: () => ['bookings', 'detail'],
    detail: id => ['bookings', 'detail', id],
  },

  inbox: {
    all: ['inbox'],
    lists: () => ['inbox', 'list'],
    list: filters => ['inbox', 'list', filters],
    details: () => ['inbox', 'detail'],
    detail: id => ['inbox', 'detail', id],
    unreadCount: () => ['inbox', 'unread-count'],
  },

  notifications: {
    all: ['inbox'],
    lists: () => ['inbox', 'list'],
    list: filters => ['inbox', 'list', filters],
  },

  wallet: {
    all: ['wallet'],
    current: params => ['wallet', 'current', params],
    withdrawals: params => ['wallet', 'withdrawals', params],
    deliveryMethods: () => ['wallet', 'delivery-methods'],
    deliveryMethod: method => ['wallet', 'delivery-methods', method],
  },

  availability: {
    all: ['availability'],
    current: () => ['availability', 'current'],
  },

  reviews: {
    all: ['reviews'],
    mine: params => ['reviews', 'mine', params],
  },

  notificationPreferences: {
    all: ['notificationPreferences'],
    current: () => ['notificationPreferences', 'current'],
  },

  disputes: {
    all: ['disputes'],
    list: bookingId => ['disputes', bookingId],
  },

  ekyc: {
    all: ['ekyc'],
    status: () => ['ekyc', 'status'],
  },

  hospitals: {
    all: ['hospitals'],
    lists: () => ['hospitals', 'list'],
    list: filters => ['hospitals', 'list', filters],
    search: params => ['hospitals', 'search', params],
    details: () => ['hospitals', 'detail'],
    detail: id => ['hospitals', 'detail', id],
  },

  privacy: {
    all: ['privacy'],
    byRole: role => ['privacy', role],
  },
};

export default queryKeys;
