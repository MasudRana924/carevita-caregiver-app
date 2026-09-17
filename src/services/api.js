import {
  apiRequest as request,
  extractAuthPayload,
  ApiError,
} from '../api/services';

export {extractAuthPayload, ApiError};

export const apiRequest = async (
  endpoint,
  method = 'GET',
  body = null,
  isFormData = false,
) => {
  try {
    return await request(endpoint, method, body, isFormData, {
      throwOnError: false,
    });
  } catch (error) {
    if (error instanceof ApiError || error?.payload) {
      return {
        success: false,
        code: error.code || error.payload?.code || null,
        message: error.message,
        data: error.payload?.data ?? null,
        status: error.status,
      };
    }
    throw error;
  }
};

export const registerUser = async (name, email, password) => {
  return apiRequest('/auth/register', 'POST', {
    name,
    email,
    password,
    role: 'CAREGIVER',
  });
};

export const sendOtp = async email => {
  return apiRequest('/auth/send-otp', 'POST', {email});
};

export const verifyOtp = async (email, otp) => {
  return apiRequest('/auth/verify-otp', 'POST', {email, otp});
};

export const resendOtp = async email => {
  return apiRequest('/auth/resend-otp', 'POST', {email});
};

export const loginUser = async (email, password) => {
  return apiRequest('/auth/login', 'POST', {email, password});
};

export const refreshAuthToken = async refreshToken => {
  return apiRequest('/auth/refresh-token', 'POST', {refreshToken});
};

export const getAuthProfile = async () => {
  return apiRequest('/auth/profile', 'GET');
};

export const updateAuthProfile = async payload => {
  return apiRequest('/auth/profile', 'PUT', payload);
};

export const changePassword = async (currentPassword, newPassword) => {
  return apiRequest('/auth/password', 'PUT', {currentPassword, newPassword});
};

export const uploadAuthPhoto = async formData => {
  return apiRequest('/auth/profile/photo', 'POST', formData, true);
};

export const registerNotificationToken = async tokenData => {
  return apiRequest('/notifications/tokens', 'POST', tokenData);
};

export const getNotificationTokens = async () => {
  return apiRequest('/notifications/tokens', 'GET');
};

export const deleteNotificationToken = async tokenId => {
  return apiRequest(`/notifications/tokens/${tokenId}`, 'DELETE');
};

export const deleteNotificationTokenByDevice = async deviceId => {
  return apiRequest(`/notifications/tokens/device/${deviceId}`, 'DELETE');
};

export const deactivateAllNotificationTokens = async () => {
  return apiRequest('/notifications/tokens/deactivate-all', 'POST');
};

export const markInboxAsRead = async inboxId => {
  return apiRequest(`/inbox/${inboxId}/read`, 'PUT');
};

export const getInboxItem = async inboxId => {
  return apiRequest(`/inbox/${inboxId}`, 'GET');
};

export const getInboxList = async (params = {}) => {
  const {page = 1, limit = 20, is_read, type} = params;
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (is_read !== undefined && is_read !== '') {
    queryParams.append('is_read', String(is_read));
  }
  if (type) {
    queryParams.append('type', type);
  }
  return apiRequest(`/inbox?${queryParams.toString()}`, 'GET');
};

export const getInboxUnreadCount = async () => {
  return apiRequest('/inbox/unread-count', 'GET');
};

export const markAllInboxAsRead = async () => {
  return apiRequest('/inbox/read-all', 'PUT');
};

/** @deprecated Use markInboxAsRead */
export const markNotificationAsRead = async notificationId => {
  return markInboxAsRead(notificationId);
};
