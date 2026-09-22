import {Platform, PermissionsAndroid} from 'react-native';
import {request, check, PERMISSIONS, RESULTS} from 'react-native-permissions';

const isGranted = result =>
  result === RESULTS.GRANTED || result === RESULTS.LIMITED;

/**
 * Photo library / gallery permission.
 * Android 13+ photo picker often works without this, but we still request for older APIs.
 */
export const requestGalleryPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      return isGranted(result);
    }

    if (Platform.OS === 'android') {
      const apiLevel =
        typeof Platform.Version === 'number'
          ? Platform.Version
          : parseInt(String(Platform.Version), 10);

      if (apiLevel >= 33) {
        const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
        return isGranted(result);
      }

      const result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      return isGranted(result);
    }

    return false;
  } catch (error) {
    console.error('Gallery permission error:', error);
    return false;
  }
};

export const requestCameraPermission = async () => {
  try {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;
    const result = await request(permission);
    return isGranted(result);
  } catch (error) {
    console.error('Camera permission error:', error);
    return false;
  }
};

/**
 * Foreground location for Start booking + live tracking.
 * Uses PermissionsAndroid on Android (more reliable with geolocation-service).
 * Does NOT request background location here — that can crash/block Start.
 */
export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const whenInUse = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return isGranted(whenInUse);
    }

    if (Platform.OS !== 'android') {
      return false;
    }

    const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
    const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

    const alreadyFine = await PermissionsAndroid.check(fine);
    const alreadyCoarse = await PermissionsAndroid.check(coarse);
    if (alreadyFine || alreadyCoarse) {
      return true;
    }

    const result = await PermissionsAndroid.requestMultiple([fine, coarse]);
    return (
      result[fine] === PermissionsAndroid.RESULTS.GRANTED ||
      result[coarse] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.error('Location permission error:', error);
    // Fallback to react-native-permissions
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      const result = await request(permission);
      return isGranted(result);
    } catch (fallbackError) {
      console.error('Location permission fallback error:', fallbackError);
      return false;
    }
  }
};

export const hasLocationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return isGranted(status);
    }
    if (Platform.OS === 'android') {
      const fine = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      const coarse = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      );
      return fine || coarse;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const requestMicrophonePermission = async () => {
  try {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO;
    const result = await request(permission);
    return isGranted(result);
  } catch (error) {
    console.error('Microphone permission error:', error);
    return false;
  }
};

export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const apiLevel =
        typeof Platform.Version === 'number'
          ? Platform.Version
          : parseInt(String(Platform.Version), 10);
      if (!Number.isNaN(apiLevel) && apiLevel < 33) {
        return true;
      }
    }

    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.NOTIFICATIONS
        : PERMISSIONS.ANDROID.POST_NOTIFICATIONS;
    const result = await request(permission);
    return isGranted(result);
  } catch (error) {
    console.error('Notification permission error:', error);
    return false;
  }
};

/** Request core app permissions on first launch / Get Started */
export const requestAppPermissions = async () => {
  await requestLocationPermission();
  await requestCameraPermission();
  await requestGalleryPermission();
  await requestMicrophonePermission();
  await requestNotificationPermission();
};
