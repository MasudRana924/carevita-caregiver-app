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
  {retry = true, throwOnError = true, skipAuth = false} = {},
) => {
  const token = skipAuth ? null : await getAuthToken();
  const headers = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  // Never set Content-Type for FormData — RN/fetch must add multipart boundary
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
      !skipAuth &&
      !AUTH_SKIP_REFRESH.some(path => endpoint.startsWith(path))
    ) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiRequest(endpoint, method, body, isFormData, {
          retry: false,
          throwOnError,
          skipAuth,
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

    if (!skipAuth) {
      await persistEnvelopeTokens(envelope);
    }
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

/** Multipart expects: "Dhaka" | "Dhaka,Mirpur" (not JSON array) */
const normalizeServiceAreas = value => {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item).trim())
      .filter(Boolean)
      .join(',');
  }

  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map(item => String(item).trim())
          .filter(Boolean)
          .join(',');
      }
    } catch (error) {
      // fall through to comma split
    }
  }

  return raw
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .join(',');
};

const resolvePhotoUri = photoAsset => {
  if (!photoAsset) {
    return null;
  }
  if (typeof photoAsset === 'string') {
    return photoAsset;
  }
  return photoAsset.uri || null;
};

/**
 * Build caregiver profile FormData exactly like backend expects.
 * Text fields always appended as strings; photo field name = profile_photo.
 */
const buildCaregiverProfileForm = (fields = {}, photoAsset = null) => {
  const form = new FormData();

  if (fields.name !== undefined && fields.name !== null) {
    form.append('name', String(fields.name));
  }

  form.append('district', String(fields.district ?? ''));
  form.append('thana', String(fields.thana ?? ''));
  form.append('bio', String(fields.bio ?? ''));
  form.append(
    'experience_years',
    String(fields.experience_years ?? ''),
  );
  form.append('hourly_rate', String(fields.hourly_rate ?? ''));
  form.append('education', String(fields.education ?? ''));
  form.append('blood_group', String(fields.blood_group ?? ''));
  form.append('date_of_birth', String(fields.date_of_birth ?? ''));
  form.append('gender', String(fields.gender ?? ''));
  form.append(
    'service_areas',
    normalizeServiceAreas(fields.service_areas ?? ''),
  );
  form.append(
    'is_available',
    String(fields.is_available ?? true),
  );

  const imageUri = resolvePhotoUri(photoAsset);
  if (imageUri && !String(imageUri).startsWith('http')) {
    form.append('profile_photo', {
      uri: imageUri,
      type:
        (typeof photoAsset === 'object' && photoAsset?.type) || 'image/jpeg',
      name:
        (typeof photoAsset === 'object' && photoAsset?.fileName) ||
        'profile.jpg',
    });
  }

  return form;
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
    const formData = buildCaregiverProfileForm(fields, photoAsset);
    return apiRequest('/caregiver/profile', 'POST', formData, true);
  },

  /**
   * PUT /caregiver/profile as multipart/form-data
   * - all text values as strings
   * - photo field name must be profile_photo
   * - do not set Content-Type (handled in apiRequest)
   */
  updateProfile: (fields, photoAsset) => {
    const formData = buildCaregiverProfileForm(fields, photoAsset);
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

export const conversationService = {
  getMyConversations: (params = {}) => {
    const {page = 1, limit = 20} = params;
    return apiRequest(
      `/conversations/my${toQuery({page, limit})}`,
      'GET',
    );
  },

  getConversation: id => apiRequest(`/conversations/${id}`, 'GET'),

  getUnreadCount: async () => {
    const res = await apiRequest('/conversations/unread', 'GET');
    const data = unwrapData(res);
    const unread = data?.unread ?? 0;
    return {...res, unread, data: {unread}};
  },

  createConversation: payload =>
    apiRequest('/conversations', 'POST', payload),
};

export const messageService = {
  getMessages: (conversationId, params = {}) => {
    const {page = 1, limit = 20} = params;
    return apiRequest(
      `/messages/conversation/${conversationId}${toQuery({page, limit})}`,
      'GET',
    );
  },

  sendMessage: payload => apiRequest('/messages', 'POST', payload),

  markAsRead: conversationId =>
    apiRequest(`/messages/conversation/${conversationId}/read`, 'PUT'),
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

  startBooking: (id, location = {}) =>
    apiRequest(`/caregiver/bookings/${id}/start`, 'POST', location),

  updateBookingLocation: (id, location = {}) =>
    apiRequest(`/caregiver/bookings/${id}/location`, 'POST', location),

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

/** Public — no auth token */
export const privacyService = {
  getByRole: (role = 'CAREGIVER') =>
    apiRequest(`/privacy-policies/${role}`, 'GET', null, false, {
      skipAuth: true,
      retry: false,
    }),
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
  privacyService,
  conversationService,
  messageService,
};
