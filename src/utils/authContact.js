const BD_MOBILE = /^01[3-9]\d{8}$/;

/** Normalize to the stored form `01XXXXXXXXX`. Empty string when invalid. */
export const normalizeBdMobile = raw => {
  let value = String(raw ?? '').replace(/[\s-]/g, '');
  if (value.startsWith('+')) {
    value = value.slice(1);
  }
  if (value.startsWith('88') && value.length > 11) {
    value = value.slice(2);
  }
  if (/^1[3-9]\d{8}$/.test(value)) {
    value = `0${value}`;
  }
  return BD_MOBILE.test(value) ? value : '';
};

/** Digits shown beside the fixed +880 prefix (national number, no trunk 0). */
export const toPhoneFieldValue = raw => {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  if (digits.startsWith('880')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('88') && digits.length > 11) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
};

export const isValidEmail = value =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

/** Body for login, verify, and resend. Only the selected identifier is included. */
export const buildAuthIdentifier = (channel, value) =>
  channel === 'phone' ? {phone: value} : {email: value};

export const maskContact = (channel, value) => {
  const text = String(value || '').trim();
  if (!text) {
    return channel === 'phone' ? 'your phone' : 'your email';
  }
  if (channel === 'phone') {
    const digits = text.replace(/\D/g, '');
    if (digits.length < 7) {
      return digits || text;
    }
    return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
  }
  const at = text.indexOf('@');
  if (at <= 0) {
    return text;
  }
  return `${text.slice(0, 1)}***@${text.slice(at + 1)}`;
};

export const PHONE_ERROR = 'Enter a valid mobile number, e.g. 01812345678';
