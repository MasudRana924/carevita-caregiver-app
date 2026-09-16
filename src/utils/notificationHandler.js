const TAB_SCREENS = ['Home', 'Bookings', 'Inbox', 'Wallet', 'Profile'];

const getBookingId = data =>
  data?.booking_id || data?.bookingId || data?.reference_id || null;

const getInboxId = data => data?.inbox_id || data?.inboxId || data?.id || null;

const normalize = value => String(value || '').toUpperCase();

export const parseNotificationData = data => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing notification data:', error);
      return {};
    }
  }
  return data || {};
};

const navigateRoot = (navigation, name, params) => {
  if (!navigation?.navigate) {
    return;
  }
  if (TAB_SCREENS.includes(name)) {
    navigation.navigate('Main', {screen: name, params});
    return;
  }
  navigation.navigate(name, params);
};

const goToBookingDetails = (navigation, bookingId, inboxId) => {
  navigateRoot(navigation, 'BookingDetails', {bookingId, inboxId});
};

const goToWallet = navigation => {
  navigateRoot(navigation, 'Wallet');
};

const shouldOpenWallet = (type, action, screen) =>
  action === 'OPEN_WALLET' ||
  type === 'EARNING_SETTLED' ||
  screen === 'wallet';

const shouldOpenBooking = (type, action, screen) =>
  action === 'START_BOOKING' ||
  type === 'PAYMENT_RECEIVED' ||
  type === 'SERVICE_START_REMINDER' ||
  type === 'REVIEW_RECEIVED' ||
  type === 'BOOKING_CREATED' ||
  type === 'BOOKING_CANCELLED' ||
  screen === 'booking_details';

/**
 * Handle notification click / FCM data and navigate by type + action
 */
export const handleNotificationClick = (rawData, navigation) => {
  const data = parseNotificationData(rawData);
  console.log('Notification data:', data);

  const bookingId = getBookingId(data);
  const inboxId = getInboxId(data);
  const type = normalize(data?.type);
  const action = normalize(data?.action);
  const screen = String(data?.screen || '').toLowerCase();

  if (shouldOpenWallet(type, action, screen)) {
    goToWallet(navigation);
    return;
  }

  if (shouldOpenBooking(type, action, screen)) {
    if (bookingId) {
      goToBookingDetails(navigation, bookingId, inboxId);
    } else {
      navigateRoot(navigation, type === 'BOOKING_CREATED' ? 'Inbox' : 'Bookings');
    }
    return;
  }

  if (bookingId) {
    goToBookingDetails(navigation, bookingId, inboxId);
    return;
  }

  navigateRoot(navigation, 'Inbox', {inboxId});
};

export const handleForegroundNotification = (remoteMessage, navigation) => {
  handleNotificationClick(
    parseNotificationData(remoteMessage?.data),
    navigation,
  );
};

export const resolveInboxBookingId = item => {
  const nested = parseNotificationData(item?.data);
  return (
    nested.booking_id ||
    nested.bookingId ||
    item?.reference_id ||
    item?.booking_id ||
    null
  );
};
