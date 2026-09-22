/**
 * Live GPS sharing while booking is SERVICE_IN_PROGRESS.
 * Caregiver does NOT show user location — only sends caregiver GPS.
 */

import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {io} from 'socket.io-client';
import {getApiHost} from '../api/endpoints';
import {
  requestStartLocationPermission,
  hasStartLocationPermission,
  getCurrentCoords,
  watchCoords,
  clearCoordsWatch,
} from '../utils/location';

const STORAGE_KEY = 'activeTrackingBookingId';
const REST_FALLBACK_MS = 20000;

let watchId = null;
let socket = null;
let restTimer = null;
let activeBookingId = null;
let lastCoords = null;
let appStateSub = null;
let listeners = new Set();

const notify = () => {
  const snapshot = getTrackingState();
  listeners.forEach(listener => {
    try {
      listener(snapshot);
    } catch (error) {
      console.error('Tracking listener error:', error);
    }
  });
};

export const getTrackingState = () => ({
  bookingId: activeBookingId,
  isSharing: Boolean(activeBookingId),
  socketConnected: Boolean(socket?.connected),
  lastCoords,
});

export const subscribeTracking = listener => {
  listeners.add(listener);
  listener(getTrackingState());
  return () => listeners.delete(listener);
};

const getAuthToken = async () => AsyncStorage.getItem('userToken');

const postRestLocation = async (bookingId, location) => {
  if (!bookingId || !location) {
    return;
  }
  try {
    // Lazy import avoids circular dependency crash with api/services
    // eslint-disable-next-line global-require
    const {bookingService} = require('../api/services');
    await bookingService.updateBookingLocation(bookingId, location);
  } catch (error) {
    console.warn('REST location fallback failed:', error?.message || error);
  }
};

export const ensureLocationPermission = async () => {
  const granted = await requestStartLocationPermission();
  if (!granted) {
    const error = new Error(
      'Location permission required to start service',
    );
    error.code = 'LOCATION_PERMISSION_DENIED';
    throw error;
  }
  return true;
};

export const getCurrentLocation = () => getCurrentCoords();

const persistActiveBooking = async bookingId => {
  if (bookingId) {
    await AsyncStorage.setItem(STORAGE_KEY, String(bookingId));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
};

export const getPersistedTrackingBookingId = async () =>
  AsyncStorage.getItem(STORAGE_KEY);

const clearWatch = () => {
  clearCoordsWatch(watchId);
  watchId = null;
};

const clearRestTimer = () => {
  if (restTimer) {
    clearInterval(restTimer);
    restTimer = null;
  }
};

const disconnectSocket = () => {
  if (socket) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch (error) {
      // ignore
    }
    socket = null;
  }
};

const emitSocketUpdate = (bookingId, location) => {
  if (!socket?.connected || !bookingId || !location) {
    return false;
  }
  try {
    socket.emit('tracking:update', {
      booking_id: bookingId,
      latitude: location.latitude,
      longitude: location.longitude,
      ...(location.accuracy != null ? {accuracy: location.accuracy} : {}),
      ...(location.heading != null ? {heading: location.heading} : {}),
      ...(location.speed != null ? {speed: location.speed} : {}),
    });
    return true;
  } catch (error) {
    console.warn('Socket emit failed:', error?.message || error);
    return false;
  }
};

const handleLocation = async location => {
  if (!activeBookingId) {
    return;
  }
  if (
    !Number.isFinite(location?.latitude) ||
    !Number.isFinite(location?.longitude)
  ) {
    return;
  }
  lastCoords = location;
  notify();

  const sent = emitSocketUpdate(activeBookingId, location);
  if (!sent) {
    await postRestLocation(activeBookingId, location);
  }
};

const startWatch = () => {
  clearWatch();
  watchId = watchCoords(
    location => {
      handleLocation(location);
    },
    error => {
      console.warn('watchPosition error:', error?.message || error);
    },
  );
};

const startRestFallback = () => {
  clearRestTimer();
  restTimer = setInterval(async () => {
    if (!activeBookingId || socket?.connected) {
      return;
    }
    try {
      const location = lastCoords || (await getCurrentCoords());
      lastCoords = location;
      await postRestLocation(activeBookingId, location);
      notify();
    } catch (error) {
      console.warn('REST fallback tick failed:', error?.message || error);
    }
  }, REST_FALLBACK_MS);
};

const connectSocket = async bookingId => {
  const token = await getAuthToken();
  if (!token) {
    return;
  }

  disconnectSocket();

  try {
    socket = io(getApiHost(), {
      path: '/socket.io',
      transports: ['websocket'],
      auth: {token},
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });

    socket.on('connect', () => {
      notify();
      if (lastCoords && bookingId) {
        emitSocketUpdate(bookingId, lastCoords);
      }
    });

    socket.on('disconnect', () => notify());
    socket.on('connect_error', error => {
      console.warn('Socket connect error:', error?.message || error);
      notify();
    });
  } catch (error) {
    console.warn('Socket init failed:', error?.message || error);
    socket = null;
  }
};

const ensureAppStateListener = () => {
  if (appStateSub) {
    return;
  }
  appStateSub = AppState.addEventListener('change', state => {
    if (state === 'active' && activeBookingId) {
      startWatch();
      if (!socket?.connected) {
        connectSocket(activeBookingId);
      }
    }
  });
};

export const startLiveTracking = async bookingId => {
  if (!bookingId) {
    throw new Error('Booking id is required for live tracking');
  }

  await ensureLocationPermission();

  if (activeBookingId && String(activeBookingId) !== String(bookingId)) {
    await stopLiveTracking();
  }

  activeBookingId = String(bookingId);
  await persistActiveBooking(activeBookingId);
  ensureAppStateListener();

  try {
    lastCoords = await getCurrentCoords();
    await handleLocation(lastCoords);
  } catch (error) {
    console.warn('Initial location fix failed:', error?.message || error);
  }

  await connectSocket(activeBookingId);
  startWatch();
  startRestFallback();
  notify();

  return getTrackingState();
};

export const stopLiveTracking = async () => {
  clearWatch();
  clearRestTimer();
  disconnectSocket();
  activeBookingId = null;
  lastCoords = null;
  await persistActiveBooking(null);
  notify();
};

export const resumeLiveTrackingIfNeeded = async bookingId => {
  if (!bookingId) {
    return getTrackingState();
  }
  try {
    // Do not prompt for permission on screen open — only resume if already allowed
    const granted = await hasStartLocationPermission();
    if (!granted) {
      return getTrackingState();
    }

    if (activeBookingId && String(activeBookingId) === String(bookingId)) {
      if (watchId == null) {
        startWatch();
      }
      if (!socket?.connected) {
        await connectSocket(activeBookingId);
      }
      startRestFallback();
      notify();
      return getTrackingState();
    }
    return await startLiveTracking(bookingId);
  } catch (error) {
    console.warn('Resume tracking failed:', error?.message || error);
    return getTrackingState();
  }
};

export const prepareStartLocation = async () => {
  await ensureLocationPermission();
  return getCurrentCoords();
};

export default {
  ensureLocationPermission,
  getCurrentLocation,
  prepareStartLocation,
  startLiveTracking,
  stopLiveTracking,
  resumeLiveTrackingIfNeeded,
  getPersistedTrackingBookingId,
  getTrackingState,
  subscribeTracking,
};
