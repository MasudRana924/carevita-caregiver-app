/**
 * Safe location helpers for Start booking + live tracking.
 * Only loads a geolocation package if its native module is linked.
 */

import {Platform, PermissionsAndroid, NativeModules} from 'react-native';

const LOCATION_TIMEOUT_MS = 20000;
const WATCH_INTERVAL_MS = 8000;

let primaryGeo = null;
let fallbackGeo = null;

const turboGet = name => {
  try {
    const {TurboModuleRegistry} = require('react-native');
    return TurboModuleRegistry?.get?.(name) || null;
  } catch (error) {
    return null;
  }
};

/** True only when native binary includes RNCGeolocation */
const isCommunityLinked = () => {
  try {
    return Boolean(
      NativeModules?.RNCGeolocation || turboGet('RNCGeolocation'),
    );
  } catch (error) {
    return false;
  }
};

/** True only when native binary includes RNFusedLocation */
const isFusedLinked = () => {
  try {
    return Boolean(
      NativeModules?.RNFusedLocation ||
        NativeModules?.RNGeolocation ||
        turboGet('RNFusedLocation'),
    );
  } catch (error) {
    return false;
  }
};

const loadPrimaryGeo = () => {
  if (primaryGeo !== null) {
    return primaryGeo;
  }
  if (!isCommunityLinked()) {
    primaryGeo = undefined;
    return primaryGeo;
  }
  try {
    // eslint-disable-next-line global-require
    primaryGeo = require('@react-native-community/geolocation').default;
  } catch (error) {
    console.warn('community geolocation unavailable:', error?.message || error);
    primaryGeo = undefined;
  }
  return primaryGeo;
};

const loadFallbackGeo = () => {
  if (fallbackGeo !== null) {
    return fallbackGeo;
  }
  if (!isFusedLinked()) {
    fallbackGeo = undefined;
    return fallbackGeo;
  }
  try {
    // eslint-disable-next-line global-require
    fallbackGeo = require('react-native-geolocation-service').default;
  } catch (error) {
    console.warn('geolocation-service unavailable:', error?.message || error);
    fallbackGeo = undefined;
  }
  return fallbackGeo;
};

export const hasStartLocationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const {check, PERMISSIONS, RESULTS} = require('react-native-permissions');
      const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
    }
    const fine = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    const coarse = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    );
    return fine || coarse;
  } catch (error) {
    return false;
  }
};

export const requestStartLocationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const {request, PERMISSIONS, RESULTS} = require('react-native-permissions');
      const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
    }

    const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
    const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

    const hasFine = await PermissionsAndroid.check(fine);
    const hasCoarse = await PermissionsAndroid.check(coarse);
    if (hasFine || hasCoarse) {
      return true;
    }

    const result = await PermissionsAndroid.requestMultiple([fine, coarse]);
    return (
      result[fine] === PermissionsAndroid.RESULTS.GRANTED ||
      result[coarse] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.error('requestStartLocationPermission:', error);
    return false;
  }
};

export const toLocationPayload = position => {
  const coords = position?.coords || position || {};
  const payload = {
    latitude: Number(coords.latitude),
    longitude: Number(coords.longitude),
  };
  if (Number.isFinite(Number(coords.accuracy))) {
    payload.accuracy = Number(coords.accuracy);
  }
  if (Number.isFinite(Number(coords.heading))) {
    payload.heading = Number(coords.heading);
  }
  if (Number.isFinite(Number(coords.speed))) {
    payload.speed = Number(coords.speed);
  }
  return payload;
};

const getPositionOnce = (geo, options) =>
  new Promise((resolve, reject) => {
    if (!geo || typeof geo.getCurrentPosition !== 'function') {
      reject(new Error('Geolocation module unavailable'));
      return;
    }
    try {
      geo.getCurrentPosition(
        pos => resolve(toLocationPayload(pos)),
        err =>
          reject(
            new Error(err?.message || 'Unable to get current location'),
          ),
        options,
      );
    } catch (error) {
      reject(error);
    }
  });

const unlinkedError = () => {
  const error = new Error(
    'Location native module is not in this build. Uninstall the app, then run: npm run android',
  );
  error.code = 'GEOLOCATION_UNAVAILABLE';
  return error;
};

/**
 * One GPS reading after permission granted.
 */
export const getCurrentCoords = async () => {
  const community = loadPrimaryGeo();
  if (community) {
    try {
      if (typeof community.setRNConfiguration === 'function') {
        community.setRNConfiguration({
          skipPermissionRequests: true,
          authorizationLevel: 'whenInUse',
        });
      }
      return await getPositionOnce(community, {
        enableHighAccuracy: true,
        timeout: LOCATION_TIMEOUT_MS,
        maximumAge: 10000,
      });
    } catch (error) {
      console.warn('community getCurrentPosition failed:', error?.message);
    }
  }

  const fused = loadFallbackGeo();
  if (fused) {
    try {
      return await getPositionOnce(fused, {
        enableHighAccuracy: true,
        timeout: LOCATION_TIMEOUT_MS,
        maximumAge: 10000,
        forceLocationManager: true,
        showLocationDialog: false,
        forceRequestLocation: false,
      });
    } catch (error) {
      console.warn('fused getCurrentPosition failed:', error?.message);
    }
  }

  throw unlinkedError();
};

export const watchCoords = (onLocation, onError) => {
  const community = loadPrimaryGeo();
  if (community && typeof community.watchPosition === 'function') {
    try {
      return community.watchPosition(
        pos => onLocation(toLocationPayload(pos)),
        err => onError?.(err),
        {
          enableHighAccuracy: true,
          distanceFilter: 5,
          interval: WATCH_INTERVAL_MS,
          fastestInterval: Math.floor(WATCH_INTERVAL_MS / 2),
        },
      );
    } catch (error) {
      console.warn('community watchPosition failed:', error?.message);
    }
  }

  const fused = loadFallbackGeo();
  if (fused && typeof fused.watchPosition === 'function') {
    try {
      return fused.watchPosition(
        pos => onLocation(toLocationPayload(pos)),
        err => onError?.(err),
        {
          enableHighAccuracy: true,
          distanceFilter: 5,
          interval: WATCH_INTERVAL_MS,
          fastestInterval: Math.floor(WATCH_INTERVAL_MS / 2),
          forceLocationManager: true,
          showLocationDialog: false,
          forceRequestLocation: false,
        },
      );
    } catch (error) {
      console.warn('fused watchPosition failed:', error?.message);
    }
  }

  return null;
};

export const clearCoordsWatch = watchId => {
  if (watchId == null) {
    return;
  }
  try {
    loadPrimaryGeo()?.clearWatch?.(watchId);
  } catch (error) {
    // ignore
  }
  try {
    loadFallbackGeo()?.clearWatch?.(watchId);
  } catch (error) {
    // ignore
  }
};

export const getLocationNativeStatus = () => ({
  communityLinked: isCommunityLinked(),
  fusedLinked: isFusedLinked(),
});

export default {
  requestStartLocationPermission,
  hasStartLocationPermission,
  getCurrentCoords,
  watchCoords,
  clearCoordsWatch,
  toLocationPayload,
  getLocationNativeStatus,
};
