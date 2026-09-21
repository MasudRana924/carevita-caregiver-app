/**
 * API Endpoints Configuration
 * Centralized endpoint definitions for all API routes
 */

const BASE_URL = 'http://192.168.10.78:8000/api/v1';
// const BASE_URL = 'https://carevita-service.onrender.com/api/v1';
// const BASE_URL = "http://172.16.223.1:8000/api/v1";

export const ENDPOINTS = {
  HEALTH: "/health",

  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    SEND_OTP: "/auth/send-otp",
    VERIFY_OTP: "/auth/verify-otp",
    RESEND_OTP: "/auth/resend-otp",
    REFRESH_TOKEN: "/auth/refresh-token",
    PROFILE: "/auth/profile",
    PASSWORD: "/auth/password",
    PHOTO: "/auth/profile/photo",
  },

  CAREGIVER: {
    PROFILE: "/caregiver/profile",
    BOOKINGS: "/caregiver/bookings/my",
    ACCEPT: (id) => `/caregiver/bookings/${id}/accept`,
    REJECT: (id) => `/caregiver/bookings/${id}/reject`,
    START: (id) => `/caregiver/bookings/${id}/start`,
    COMPLETE: (id) => `/caregiver/bookings/${id}/complete`,
    WALLET: "/caregiver/wallet",
    AVAILABILITY: "/caregiver/availability",
    WITHDRAWALS: "/caregiver/withdrawals",
    DELIVERY_METHODS: "/caregiver/withdrawals/delivery-methods",
    DELIVERY_METHOD: (method) =>
      `/caregiver/withdrawals/delivery-methods/${method}`,
    REVIEWS: "/caregiver/reviews/my",
    EKYC_INITIATE: "/caregiver/ekyc/initiate",
    EKYC_STATUS: "/caregiver/ekyc/status",
  },

  BOOKINGS: {
    DETAIL: (id) => `/bookings/${id}`,
    CANCEL: (id) => `/bookings/${id}/cancel`,
    DISPUTE: (id) => `/bookings/${id}/dispute`,
    DISPUTES: (id) => `/bookings/${id}/disputes`,
  },

  HOSPITALS: {
    LIST: "/hospitals",
    DETAIL: (id) => `/hospitals/${id}`,
  },

  INBOX: {
    LIST: "/inbox",
    UNREAD_COUNT: "/inbox/unread-count",
    DETAIL: (id) => `/inbox/${id}`,
    READ: (id) => `/inbox/${id}/read`,
    READ_ALL: "/inbox/read-all",
  },

  NOTIFICATIONS: {
    TOKENS: "/notifications/tokens",
    TOKEN: (id) => `/notifications/tokens/${id}`,
    TOKEN_DEVICE: (deviceId) => `/notifications/tokens/device/${deviceId}`,
    DEACTIVATE_ALL: "/notifications/tokens/deactivate-all",
    PREFERENCES: "/notifications/preferences",
  },
};

export const getFullUrl = (endpoint) => `${BASE_URL}${endpoint}`;

export default ENDPOINTS;
