/**
 * Start booking flow:
 * permission → GPS → POST /start → socket watch
 */

import {
  requestStartLocationPermission,
  getCurrentCoords,
} from '../utils/location';
import {startLiveTracking} from './liveTrackingService';

export const runStartBookingFlow = async ({
  bookingId,
  startBookingMutate,
}) => {
  if (!bookingId) {
    const error = new Error('Booking id is required');
    error.code = 'MISSING_BOOKING_ID';
    throw error;
  }
  if (typeof startBookingMutate !== 'function') {
    const error = new Error('Start booking action is missing');
    error.code = 'MISSING_START_ACTION';
    throw error;
  }

  // 1) Permission dialog
  const granted = await requestStartLocationPermission();
  if (!granted) {
    const error = new Error(
      'Location permission required to start service',
    );
    error.code = 'LOCATION_PERMISSION_DENIED';
    throw error;
  }

  // 2) One GPS fix
  const location = await getCurrentCoords();
  if (
    !Number.isFinite(location?.latitude) ||
    !Number.isFinite(location?.longitude)
  ) {
    throw new Error('Could not read GPS coordinates. Turn on location and retry.');
  }

  // 3) Start API
  const response = await startBookingMutate({
    id: bookingId,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      ...(location.accuracy != null ? {accuracy: location.accuracy} : {}),
      ...(location.heading != null ? {heading: location.heading} : {}),
      ...(location.speed != null ? {speed: location.speed} : {}),
    },
  });

  // 4) Socket + watch (non-fatal after successful start)
  try {
    await startLiveTracking(bookingId);
  } catch (trackingError) {
    console.warn(
      'Live tracking failed after start:',
      trackingError?.message || trackingError,
    );
  }

  return response;
};

export const explainStartError = error => {
  const code = error?.code;
  if (code === 'LOCATION_PERMISSION_DENIED') {
    return {
      title: 'Permission required',
      message: 'Location permission required to start service',
    };
  }
  if (code === 'GEOLOCATION_UNAVAILABLE') {
    return {
      title: 'Rebuild required',
      message:
        'Location module missing. Uninstall app, then run: npm run android',
    };
  }
  return {
    title: 'Could not start',
    message: error?.message || 'Failed to start booking',
  };
};

export default {
  runStartBookingFlow,
  explainStartError,
};
