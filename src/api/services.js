/**
 * API Services
 * HTTP client and service functions for CareMate envelope responses
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {getFullUrl} from './endpoints';
import {expireSession} from './session';
import {
  ApiError,
  extractAuthData,
  getEnvelopeMessage,
  isAuthFailure,
  normalizeEnvelope,
  toApiError,
  unwrapData,
  unwrapList,
} from './envelope';

const AUTH_SKIP_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/send-otp',
  '/auth/refresh-token',
];

export {ApiError, extractAuthData, unwrapData, unwrapList};

export const extractAuthPayload = extractAuthData;

const persistAuthTokens = async data => {
  if (data?.token) {
    await AsyncStorage.setItem('userToken', data.token);
  }
  if (data?.refreshToken) {
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
  }
};

const persistEnvelopeTokens = async envelope => {
  const tokens = extractAuthData(envelope);
  if (tokens.token || tokens.refreshToken) {
    await persistAuthTokens(tokens);
  }
  return tokens;
};

const parseResponseBody = async response => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const getAuthToken = async () => AsyncStorage.getItem('userToken');

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
    const payload = await parseResponseBody(response);
    const envelope = normalizeEnvelope(payload, response.status);
    const tokens = extractAuthData(envelope);
    if (envelope.success && tokens.token) {
      await persistAuthTokens(tokens);
      return tokens.token;
    }
  } catch (error) {
    console.error('Refresh token error:', error);
  }
  return null;
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
    const raw = await parseResponseBody(response);
    const envelope = normalizeEnvelope(raw, response.status);
    const failed =
      !response.ok || envelope.success === false || isAuthFailure(raw, response.status);

    if (
      failed &&
      isAuthFailure(raw, response.status) &&
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
      await expireSession();
    }

    if (failed) {
      const error = toApiError(raw || envelope, response.status);
      error.message = envelope.message || getEnvelopeMessage(raw, response.status);
      error.code = envelope.code || error.code;
      if (throwOnError) {
        throw error;
      }
      return envelope;
    }

    await persistEnvelopeTokens(envelope);
    return envelope;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
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

  login: (email, password) =>
    apiRequest('/auth/login', 'POST', {email, password}),

  sendOtp: email => apiRequest('/auth/send-otp', 'POST', {email}),

  verifyOtp: (email, otp) =>
    apiRequest('/auth/verify-otp', 'POST', {email, otp}),

  resendOtp: email => apiRequest('/auth/resend-otp', 'POST', {email}),

  refreshToken: refreshToken =>
    apiRequest('/auth/refresh-token', 'POST', {refreshToken}),

  getAuthProfile: () => apiRequest('/auth/profile', 'GET'),

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

const toQuery = params => {
  const queryParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    queryParams.append(key, String(value));
  });
  const qs = queryParams.toString();
  return qs ? `?${qs}` : '';
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
    const {page, limit, offset} = params;
    return apiRequest(`/caregiver/wallet${toQuery({page, limit, offset})}`, 'GET');
  },

  getAvailability: () => apiRequest('/caregiver/availability', 'GET'),

  updateAvailability: slots =>
    apiRequest('/caregiver/availability', 'PUT', {slots}),

  getWithdrawals: (params = {}) =>
    apiRequest(`/caregiver/withdrawals${toQuery(params)}`, 'GET'),

  getDeliveryMethods: () =>
    apiRequest('/caregiver/withdrawals/delivery-methods', 'GET'),

  getDeliveryMethodFields: method =>
    apiRequest(`/caregiver/withdrawals/delivery-methods/${method}`, 'GET'),

  createWithdrawal: payload =>
    apiRequest('/caregiver/withdrawals', 'POST', payload),

  getReviews: (params = {}) =>
    apiRequest(`/caregiver/reviews/my${toQuery(params)}`, 'GET'),

  initiateEkyc: redirectUrl =>
    apiRequest('/caregiver/ekyc/initiate', 'POST', {
      redirect_url: redirectUrl,
    }),

  getEkycStatus: () => apiRequest('/caregiver/ekyc/status', 'GET'),
};

export const inboxService = {
  getInbox: (params = {}) => {
    const {page = 1, limit = 20, is_read, type} = params;
    return apiRequest(
      `/inbox${toQuery({page, limit, is_read, type})}`,
      'GET',
    );
  },

  getInboxItem: id => apiRequest(`/inbox/${id}`, 'GET'),

  getUnreadCount: async () => {
    const res = await apiRequest('/inbox/unread-count', 'GET');
    const data = unwrapData(res);
    const unread = data?.unread ?? 0;
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

export const notificationPreferenceService = {
  getPreferences: () => apiRequest('/notifications/preferences', 'GET'),
  updatePreferences: payload =>
    apiRequest('/notifications/preferences', 'PUT', payload),
};

export const bookingService = {
  getMyBookings: (params = {}) => {
    const {page, limit = 20, offset, status} = params;
    return apiRequest(
      `/caregiver/bookings/my${toQuery({page, limit, offset, status})}`,
      'GET',
    );
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

  createDispute: (id, payload) =>
    apiRequest(`/bookings/${id}/dispute`, 'POST', payload),

  getDisputes: id => apiRequest(`/bookings/${id}/disputes`, 'GET'),
};

export const hospitalService = {
  getHospitals: (params = {}) => hospitalService.searchHospitals(params),

  getHospitalDetails: id => apiRequest(`/hospitals/${id}`, 'GET'),

  searchHospitals: (params = {}) => {
    const {page = 1, limit = 20, district} = params;
    return apiRequest(`/hospitals${toQuery({page, limit, district})}`, 'GET');
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
  notificationPreferenceService,
  pushTokenService,
};
