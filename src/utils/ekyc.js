export const EKYC_REDIRECT_URL = 'caremate-caregiver://ekyc/callback';

export const getEkycStatusValue = user => {
  if (!user || typeof user !== 'object') {
    return false;
  }
  if (typeof user.ekyc_status === 'boolean') {
    return user.ekyc_status;
  }
  if (user.user && typeof user.user === 'object') {
    return user.user.ekyc_status === true;
  }
  return false;
};

export const isEkycApproved = value => getEkycStatusValue(value) === true;

export const normalizeAuthUser = raw => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const nested = raw.user && typeof raw.user === 'object' ? raw.user : null;
  const user = raw.id || raw.email || raw.role ? raw : nested || raw;
  return {
    ...user,
    ekyc_status: user.ekyc_status === true,
    ekyc_session_status: user.ekyc_session_status ?? nested?.ekyc_session_status ?? null,
  };
};

export const isEkycCallbackUrl = url => {
  const value = String(url || '');
  return (
    value.startsWith(EKYC_REDIRECT_URL) || value.includes('://ekyc/callback')
  );
};

export const parseEkycCallback = url => {
  const query = String(url || '').split('?')[1] || '';
  const params = {};
  query.split('&').forEach(part => {
    if (!part) {
      return;
    }
    const [rawKey, rawValue] = part.split('=');
    if (!rawKey) {
      return;
    }
    params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue || '');
  });
  return {
    verificationSessionId:
      params.verificationSessionId || params.session_id || null,
    status: params.status || null,
  };
};

export const getEkycSessionStatus = data =>
  data?.ekyc_session_status || data?.status || null;

export const normalizeEkycSessionStatus = value =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

export const isEkycInReview = value => {
  const status = normalizeEkycSessionStatus(
    typeof value === 'object' ? getEkycSessionStatus(value) : value,
  );
  return status === 'in review' || status === 'review';
};

export const isEkycDeclined = value => {
  const status = normalizeEkycSessionStatus(
    typeof value === 'object' ? getEkycSessionStatus(value) : value,
  );
  return status === 'declined' || status === 'rejected' || status === 'failed';
};

export const applyEkycStatus = (user, data) => {
  if (!data || typeof data !== 'object') {
    return user || {};
  }
  return {
    ...(user || {}),
    ekyc_status: data.ekyc_status === true,
    ekyc_session_status: data.ekyc_session_status ?? data.status ?? null,
    ekyc_verified_at: data.ekyc_verified_at ?? user?.ekyc_verified_at ?? null,
  };
};

export const getApiErrorText = error => {
  const code = error?.code || error?.payload?.code;
  const message =
    error?.message || error?.payload?.message || 'Something went wrong';
  return code ? `${code}: ${message}` : message;
};
