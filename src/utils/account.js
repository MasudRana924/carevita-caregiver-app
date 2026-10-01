export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const MONTH_NAMES = MONTHS;

export const GENDER_OPTIONS = [
  {value: 'male', label: 'Male'},
  {value: 'female', label: 'Female'},
  {value: 'other', label: 'Other'},
];

/** Resize/compress in the picker so uploads stay well under 5MB. */
export const PROFILE_PHOTO_PICKER_OPTIONS = {
  mediaType: 'photo',
  selectionLimit: 1,
  quality: 0.8,
  maxWidth: 1200,
  maxHeight: 1200,
};

// Only display fields are merged into the auth user; eKYC / role gating stays
// owned by the auth profile hydrate flow.
const AUTH_SYNC_KEYS = [
  'name',
  'email',
  'phone',
  'profile_photo',
  'gender',
  'date_of_birth',
  'address',
  'emergency_contact',
  'language_preference',
];

export const toAuthUserPatch = account => {
  const patch = {};
  AUTH_SYNC_KEYS.forEach(key => {
    if (account && key in account) {
      patch[key] = account[key];
    }
  });
  return patch;
};

export const normalizeGenderValue = value => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'male' || raw === 'm') {
    return 'male';
  }
  if (raw === 'female' || raw === 'f') {
    return 'female';
  }
  if (raw === 'other') {
    return 'other';
  }
  return '';
};

export const genderLabel = value =>
  GENDER_OPTIONS.find(item => item.value === normalizeGenderValue(value))
    ?.label || '';

/** "1992-08-15" (or ISO) → {year, month (1-12), day}; parsed without timezone shifts. */
export const parseYmd = value => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  if (!match) {
    return null;
  }
  return {year: Number(match[1]), month: Number(match[2]), day: Number(match[3])};
};

export const toYmd = ({year, month, day}) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const normalizeYmd = value => {
  const parts = parseYmd(value);
  return parts ? toYmd(parts) : '';
};

export const todayParts = () => {
  const now = new Date();
  return {year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate()};
};

export const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

/** "1992-08-15" → "15 Aug 1992" */
export const formatDob = value => {
  const parts = parseYmd(value);
  if (!parts) {
    return '';
  }
  return `${parts.day} ${MONTHS[parts.month - 1]} ${parts.year}`;
};

const inferMime = name => {
  const ext = String(name || '').split('.').pop().toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') {
    return 'image/jpeg';
  }
  if (ext === 'png') {
    return 'image/png';
  }
  if (ext === 'webp') {
    return 'image/webp';
  }
  return '';
};

/** Picker asset → {file} ready for PUT /user/me/photo, or {error}. */
export const prepareProfilePhoto = asset => {
  if (!asset?.uri) {
    return {error: 'Could not read that image.'};
  }
  let mime = String(asset.type || '').toLowerCase();
  if (mime === 'image/jpg') {
    mime = 'image/jpeg';
  }
  if (!mime) {
    mime = inferMime(asset.fileName || asset.uri);
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
    return {
      error: 'Invalid file type. Only JPEG, PNG and WEBP images are allowed.',
    };
  }
  const size = Number(asset.fileSize || 0);
  if (size > MAX_PHOTO_BYTES) {
    return {error: 'File too large. Maximum size is 5MB.'};
  }
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  return {
    file: {
      uri: asset.uri,
      mime,
      name: asset.fileName || `avatar.${ext}`,
      size,
    },
  };
};
