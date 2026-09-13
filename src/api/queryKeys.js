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
  },

  hospitals: {
    all: ['hospitals'],
    lists: () => ['hospitals', 'list'],
    list: filters => ['hospitals', 'list', filters],
    search: params => ['hospitals', 'search', params],
    details: () => ['hospitals', 'detail'],
    detail: id => ['hospitals', 'detail', id],
  },
};

export default queryKeys;
