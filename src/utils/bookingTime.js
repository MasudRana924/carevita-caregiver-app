const DHAKA_OFFSET = '+06:00';
const REMINDER_WINDOW_MS = 65 * 60 * 1000;
const OVERDUE_WINDOW_MS = 15 * 60 * 1000;

const HIDDEN_STATUSES = [
  'CANCELLED',
  'COMPLETED',
  'SERVICE_COMPLETED',
  'SERVICE_IN_PROGRESS',
  'IN_PROGRESS',
  'PROVIDER_ASSIGNED',
];

export const getBookingStartMs = booking => {
  if (!booking) {
    return null;
  }

  const iso =
    booking.start_at ||
    booking.starts_at ||
    booking.start_datetime ||
    booking.scheduled_start;
  if (iso) {
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
  }

  const time = booking.start_time;
  if (time && String(time).includes('T')) {
    const parsed = new Date(time);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
  }

  const datePart = String(booking.booking_date || '').slice(0, 10);
  if (!datePart || !time) {
    return null;
  }

  let timePart = String(time).slice(0, 8);
  if (/^\d{2}:\d{2}$/.test(timePart)) {
    timePart = `${timePart}:00`;
  }
  if (!/^\d{2}:\d{2}:\d{2}$/.test(timePart)) {
    return null;
  }

  const parsed = new Date(`${datePart}T${timePart}${DHAKA_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

export const formatCountdown = ms => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )}:${String(seconds).padStart(2, '0')}`;
};

export const findReminderBooking = (bookings, now = Date.now()) => {
  const list = Array.isArray(bookings) ? bookings : [];
  const candidates = [];

  list.forEach(booking => {
    if (HIDDEN_STATUSES.includes(booking?.status)) {
      return;
    }
    const startMs = getBookingStartMs(booking);
    if (!startMs) {
      return;
    }
    const remaining = startMs - now;
    if (remaining > REMINDER_WINDOW_MS) {
      return;
    }
    if (remaining < -OVERDUE_WINDOW_MS && !booking?.can_start) {
      return;
    }
    candidates.push({booking, startMs, remaining});
  });

  candidates.sort((a, b) => a.startMs - b.startMs);
  return candidates[0] || null;
};

export const parseRatingValue = (data, body) => {
  const raw = Number(data?.rating ?? data?.stars ?? data?.score);
  if (raw >= 1 && raw <= 5) {
    return Math.round(raw);
  }
  const match = String(body || '').match(/(\d)\s*star/i);
  if (match) {
    return Number(match[1]);
  }
  return 5;
};
