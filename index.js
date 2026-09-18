/**
 * @format
 */

import {AppRegistry, NativeModules, Platform} from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';

const ekycCopy = type => {
  const value = String(type || '').toUpperCase();
  if (value === 'EKYC_APPROVED') {
    return {
      title: 'Identity verified',
      body: 'Your eKYC was approved. You can continue in the app.',
    };
  }
  if (value === 'EKYC_DECLINED') {
    return {
      title: 'Identity verification declined',
      body: 'Your eKYC was declined. Please retry verification.',
    };
  }
  return null;
};

setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  const data = remoteMessage?.data || {};
  const type = data.type || data.event || '';
  const fallback = ekycCopy(type);
  const title =
    remoteMessage?.notification?.title ||
    data.title ||
    fallback?.title ||
    'Nirapod';
  const body =
    remoteMessage?.notification?.body ||
    data.body ||
    data.message ||
    fallback?.body ||
    '';

  // Notification payloads are already shown in the system tray when the app is
  // backgrounded or killed. Data-only messages need a local notification.
  if (remoteMessage?.notification) {
    return;
  }
  if (Platform.OS === 'android' && NativeModules.PushDisplay) {
    NativeModules.PushDisplay.show(title, body, String(type || 'default'));
  }
});

AppRegistry.registerComponent(appName, () => App);
