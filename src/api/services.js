/**
 * API Services
 * HTTP client and service functions for API calls
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {getFullUrl} from './endpoints';

const AUTH_SKIP_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/send-otp',
  '/auth/refresh-token',
];

const persistAuthTokens = async data => {
  if (data?.token) {
    await AsyncStorage.setItem('userToken', data.token);
  }
  if (data?.refreshToken) {
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
  }
};

const extractTokens = payload => {
  const nested = payload?.data || {};
  return {
    token: nested.token || payload?.token,
    refreshToken: nested.refreshToken || payload?.refreshToken,
  };
};

const refreshAccessToken = async () => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(getFullUrl('/auth/refresh-token'), {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({refreshToken}),
    });
    const payload = await response.json();
    const tokens = extractTokens(payload);
    if (payload?.success && tokens.token) {
      await persistAuthTokens(tokens);
      return tokens.token;
    }
  } catch (error) {
    console.error('Refresh token error:', error);
  }
  return null;
};

const parseResponseBody = async response => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const getErrorMessage = (payload, status) => {
  if (payload?.message) {
    return payload.message;
  }
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    return typeof first === 'string' ? first : first?.message || `HTTP error! status: ${status}`;
  }
  return `HTTP error! status: ${status}`;
};

const getAuthToken = async () => {
  return await AsyncStorage.getItem('userToken');
};

export const apiRequest = async (
  endpoint,
  method = 'GET',
  body = null,
  isFormData = false,
  {retry = true, throwOnError = true} = {},
) => {
  const token = await getAuthToken();

  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(getFullUrl(endpoint), config);
    const data = await parseResponseBody(response);

    if (
      response.status === 401 &&
      retry &&
      token &&
      !AUTH_SKIP_REFRESH.some(path => endpoint.startsWith(path))
    ) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiRequest(endpoint, method, body, isFormData, {
          retry: false,
          throwOnError,
        });
      }
    }

    if (!response.ok) {
      const error = new Error(getErrorMessage(data, response.status));
      error.status = response.status;
      error.payload = data;
      if (throwOnError) {
        throw error;
      }
      return {
        ...(data || {}),
        success: false,
        message: error.message,
        status: response.status,
      };
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export const authService = {
  register: (name, email, password) =>
    apiRequest('/auth/register', 'POST', {
      name,
      email,
      password,
      role: 'CAREGIVER',
    }),

  login: (email, password) => apiRequest('/auth/login', 'POST', {email, password}),

  sendOtp: email => apiRequest('/auth/send-otp', 'POST', {email}),

  verifyOtp: (email, otp) => apiRequest('/auth/verify-otp', 'POST', {email, otp}),

  resendOtp: email => apiRequest('/auth/resend-otp', 'POST', {email}),

  refreshToken: refreshToken =>
    apiRequest('/auth/refresh-token', 'POST', {refreshToken}),

  getAuthProfile: async () => {
    const res = await apiRequest('/auth/profile', 'GET');
    return {
      ...res,
      data: res?.user || res?.data,
      user: res?.user || res?.data,
    };
  },

  updateAuthProfile: payload => apiRequest('/auth/profile', 'PUT', payload),

  changePassword: (currentPassword, newPassword) =>
    apiRequest('/auth/password', 'PUT', {currentPassword, newPassword}),

  uploadProfilePhoto: formData =>
    apiRequest('/auth/profile/photo', 'POST', formData, true),
};

const appendProfileFields = (formData, fields = {}) => {
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      formData.append(key, value.join(','));
      return;
    }
    if (typeof value === 'boolean') {
      formData.append(key, value ? 'true' : 'false');
      return;
    }
    formData.append(key, String(value));
  });
};

export const caregiverService = {
  getMyProfile: () =>
    apiRequest('/caregiver/profile', 'GET', null, false, {throwOnError: false}),

  createProfile: (fields, photoAsset) => {
    const formData = new FormData();
    appendProfileFields(formData, fields);
    if (photoAsset?.uri) {
      formData.append('profile_photo', {
        uri: photoAsset.uri,
        type: photoAsset.type || 'image/jpeg',
        name: photoAsset.fileName || 'profile_photo.jpg',
      });
    }
    return apiRequest('/caregiver/profile', 'POST', formData, true);
  },

  updateProfile: (fields, photoAsset) => {
    const formData = new FormData();
    appendProfileFields(formData, fields);
    if (photoAsset?.uri) {
      formData.append('profile_photo', {
        uri: photoAsset.uri,
        type: photoAsset.type || 'image/jpeg',
        name: photoAsset.fileName || 'profile_photo.jpg',
      });
    }
    return apiRequest('/caregiver/profile', 'PUT', formData, true);
  },

  getWallet: (params = {}) => {
    const {limit = 20, offset = 0} = params;
    const queryParams = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return apiRequest(`/caregiver/wallet?${queryParams.toString()}`, 'GET');
  },
};

export const inboxService = {
  getInbox: (params = {}) => {
    const {page = 1, limit = 20, is_read, type} = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (is_read !== undefined && is_read !== '') {
      queryParams.append('is_read', String(is_read));
    }
    if (type) {
      queryParams.append('type', type);
    }
    return apiRequest(`/inbox?${queryParams.toString()}`, 'GET');
  },

  getInboxItem: id => apiRequest(`/inbox/${id}`, 'GET'),

  getUnreadCount: async () => {
    const res = await apiRequest('/inbox/unread-count', 'GET');
    const unread = res?.unread ?? res?.data?.unread ?? 0;
    return {...res, unread, data: {unread}};
  },

  markAsRead: id => apiRequest(`/inbox/${id}/read`, 'PUT'),

  markAllAsRead: () => apiRequest('/inbox/read-all', 'PUT'),
};

/** @deprecated Use inboxService — kept so existing imports keep working */
export const notificationService = {
  getNotifications: params => inboxService.getInbox(params),
  getNotification: id => inboxService.getInboxItem(id),
  markAsRead: id => inboxService.markAsRead(id),
  markAllAsRead: () => inboxService.markAllAsRead(),
};

export const bookingService = {
  getMyBookings: (params = {}) => {
    const {page, limit = 20, offset, status} = params;
    const queryParams = new URLSearchParams();
    if (page) {
      queryParams.append('page', String(page));
    }
    if (limit) {
      queryParams.append('limit', String(limit));
    }
    if (offset !== undefined && offset !== '') {
      queryParams.append('offset', String(offset));
    }
    if (status) {
      queryParams.append('status', status);
    }
    const qs = queryParams.toString();
    return apiRequest(`/caregiver/bookings/my${qs ? `?${qs}` : ''}`, 'GET');
  },

  getBookingDetails: id => apiRequest(`/bookings/${id}`, 'GET'),

  acceptBooking: id => apiRequest(`/caregiver/bookings/${id}/accept`, 'POST'),

  rejectBooking: (id, reason) =>
    apiRequest(`/caregiver/bookings/${id}/reject`, 'POST', {
      reason: reason || 'Not available',
    }),

  cancelBooking: (id, reason) =>
    apiRequest(`/bookings/${id}/cancel`, 'POST', {
      reason: reason || 'Emergency',
    }),

  startBooking: id => apiRequest(`/caregiver/bookings/${id}/start`, 'POST'),

  completeBooking: id =>
    apiRequest(`/caregiver/bookings/${id}/complete`, 'POST'),
};

export const hospitalService = {
  getHospitals: (params = {}) => hospitalService.searchHospitals(params),

  getHospitalDetails: id => apiRequest(`/hospitals/${id}`, 'GET'),

  searchHospitals: (params = {}) => {
    const {page = 1, limit = 20, district} = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (district) {
      queryParams.append('district', district);
    }
    return apiRequest(`/hospitals?${queryParams.toString()}`, 'GET');
  },
};

export const pushTokenService = {
  register: payload => apiRequest('/notifications/tokens', 'POST', payload),
  list: () => apiRequest('/notifications/tokens', 'GET'),
  remove: id => apiRequest(`/notifications/tokens/${id}`, 'DELETE'),
  removeByDevice: deviceId =>
    apiRequest(`/notifications/tokens/device/${deviceId}`, 'DELETE'),
  deactivateAll: () =>
    apiRequest('/notifications/tokens/deactivate-all', 'POST'),
};

export default {
  apiRequest,
  authService,
  caregiverService,
  bookingService,
  hospitalService,
  inboxService,
  notificationService,
  pushTokenService,
};
