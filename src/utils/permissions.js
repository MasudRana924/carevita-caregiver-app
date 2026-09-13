import {Platform} from 'react-native';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';

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
      const apiLevel = typeof Platform.Version === 'number'
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

export const requestLocationPermission = async () => {
  try {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    const result = await request(permission);
    return isGranted(result);
  } catch (error) {
    console.error('Location permission error:', error);
    return false;
  }
};

export const requestNotificationPermission = async () => {
  try {
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
  await requestNotificationPermission();
};
