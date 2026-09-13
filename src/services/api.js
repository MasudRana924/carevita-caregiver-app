import AsyncStorage from '@react-native-async-storage/async-storage';

// const BASE_URL = 'http://192.168.10.78:8000/api/v1';
const BASE_URL = 'https://carevita-service.onrender.com/api/v1';

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
    const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
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

export const extractAuthPayload = response => {
  const data = response?.data || {};
  return {
    token: data.token || response?.token,
    refreshToken: data.refreshToken || response?.refreshToken,
    user: data.user || response?.user,
  };
};

export const apiRequest = async (
  endpoint,
  method = 'GET',
  body = null,
  isFormData = false,
  {retry = true} = {},
) => {
  const token = await AsyncStorage.getItem('userToken');

  const config = {
    method,
    headers: {},
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!isFormData) {
    config.headers['Content-Type'] = 'application/json';
  }

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = {
      success: false,
      message: `HTTP error! status: ${response.status}`,
    };
  }

  if (
    response.status === 401 &&
    retry &&
    token &&
    !AUTH_SKIP_REFRESH.some(path => endpoint.startsWith(path))
  ) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest(endpoint, method, body, isFormData, {retry: false});
    }
  }

  if (data && typeof data === 'object') {
    data.status = response.status;
  }

  return data;
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
