export const AUTH_CODES = ['TOKEN_EXPIRED', 'UNAUTHORIZED'];
export const CONFLICT_CODE = 'CONFLICT';

export class ApiError extends Error {
  constructor({message, code, status, payload} = {}) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.code = code || payload?.code || null;
    this.status = status ?? payload?.statusCode ?? payload?.status ?? null;
    this.payload = payload || null;
  }
}

export const getEnvelopeCode = payload =>
  String(payload?.code || payload?.error || '').toUpperCase();

export const getEnvelopeMessage = (payload, status) => {
  if (payload?.message) {
    return payload.message;
  }
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    return typeof first === 'string'
      ? first
      : first?.message || `HTTP error! status: ${status}`;
  }
  return `HTTP error! status: ${status}`;
};

export const isAuthFailure = (payload, status) => {
  const code = getEnvelopeCode(payload);
  return status === 401 || AUTH_CODES.includes(code);
};

export const isConflict = (error, payload, status) => {
  const code = String(
    error?.code || getEnvelopeCode(payload || error?.payload),
  ).toUpperCase();
  const httpStatus = status ?? error?.status ?? payload?.statusCode;
  return code === CONFLICT_CODE || httpStatus === 409;
};

export const unwrapData = payload => {
  if (payload?.data === undefined || payload?.data === null) {
    return {};
  }
  return payload.data;
};

export const unwrapList = payload => {
  const data = payload?.data;
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.bookings)) {
    return data.bookings;
  }
  if (Array.isArray(data?.items)) {
    return data.items;
  }
  if (Array.isArray(data?.results)) {
    return data.results;
  }
  if (Array.isArray(data?.slots)) {
    return data.slots;
  }
  if (Array.isArray(data?.transactions)) {
    return data.transactions;
  }
  if (Array.isArray(data?.reviews)) {
    return data.reviews;
  }
  if (Array.isArray(data?.withdrawals)) {
    return data.withdrawals;
  }
  if (Array.isArray(data?.disputes)) {
    return data.disputes;
  }
  return [];
};

export const unwrapPagination = payload =>
  payload?.meta?.pagination || payload?.pagination || null;

export const extractAuthData = payload => {
  const data = unwrapData(payload);
  const user =
    data?.user && typeof data.user === 'object' ? data.user : data;
  return {
    token: data?.token || payload?.token || null,
    refreshToken: data?.refreshToken || payload?.refreshToken || null,
    user: user?.id || user?.email || user?.role ? user : null,
  };
};

export const normalizeEnvelope = (payload, status) => {
  const body = payload && typeof payload === 'object' ? payload : {};
  const success = body.success === true;
  const data = body.data === undefined ? null : body.data;
  return {
    success,
    statusCode: body.statusCode ?? status,
    message: body.message || (success ? 'Success' : getEnvelopeMessage(body, status)),
    code: body.code || null,
    data,
    meta: body.meta || null,
    status,
  };
};

export const getAcceptConflictMessage = error => {
  if (isConflict(error)) {
    return (
      error?.message ||
      'This booking overlaps another booking or is outside your weekly availability.'
    );
  }
  return error?.message || 'Failed to accept booking';
};

export const toApiError = (payload, status) =>
  new ApiError({
    message: getEnvelopeMessage(payload, status),
    code: getEnvelopeCode(payload),
    status,
    payload,
  });
