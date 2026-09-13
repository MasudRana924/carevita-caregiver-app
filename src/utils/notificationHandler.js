const TAB_SCREENS = ['Home', 'Bookings', 'Inbox', 'Wallet', 'Profile'];

const getBookingId = data =>
  data?.booking_id || data?.bookingId || data?.reference_id || null;

const getInboxId = data => data?.inbox_id || data?.inboxId || data?.id || null;

const getType = data => data?.type || data?.action;

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

/**
 * Handle notification click / FCM data and navigate by type + booking_id
 */
export const handleNotificationClick = (rawData, navigation) => {
  const data = parseNotificationData(rawData);
  console.log('Notification data:', data);

  const bookingId = getBookingId(data);
  const inboxId = getInboxId(data);
  const type = getType(data);

  switch (type) {
    case 'BOOKING_CREATED':
      if (bookingId) {
        goToBookingDetails(navigation, bookingId, inboxId);
      } else {
        navigateRoot(navigation, 'Inbox', {inboxId});
      }
      break;

    case 'PAYMENT_RECEIVED':
      if (bookingId) {
        goToBookingDetails(navigation, bookingId, inboxId);
      } else {
        navigateRoot(navigation, 'Bookings');
      }
      break;

    case 'BOOKING_CANCELLED':
      if (bookingId) {
        goToBookingDetails(navigation, bookingId, inboxId);
      } else {
        navigateRoot(navigation, 'Bookings');
      }
      break;

    default:
      if (bookingId) {
        goToBookingDetails(navigation, bookingId, inboxId);
      } else {
        navigateRoot(navigation, 'Inbox', {inboxId});
      }
  }
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
