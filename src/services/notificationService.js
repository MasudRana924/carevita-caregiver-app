import {
  getMessaging,
  getToken,
  getAPNSToken,
  requestPermission,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  getInitialNotification,
  registerDeviceForRemoteMessages,
  isDeviceRegisteredForRemoteMessages,
  setAutoInitEnabled,
} from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {apiRequest} from './api';
import {getFullUrl} from '../api/endpoints';
import {normalizeEnvelope} from '../api/envelope';
import {requestNotificationPermission} from '../utils/permissions';
import {
  handleNotificationClick,
  isEkycPushType,
  parseNotificationData,
} from '../utils/notificationHandler';

const AUTHORIZED = 1;
const PROVISIONAL = 2;

const safeUnsubscribe = unsubscribe => {
  if (typeof unsubscribe === 'function') {
    unsubscribe();
  }
};

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.foregroundBannerHandler = null;
    this.ekycPushHandler = null;
    this.registerInFlight = null;
  }

  setForegroundBannerHandler(handler) {
    this.foregroundBannerHandler = handler;
    return () => {
      if (this.foregroundBannerHandler === handler) {
        this.foregroundBannerHandler = null;
      }
    };
  }

  setEkycPushHandler(handler) {
    this.ekycPushHandler = handler;
    return () => {
      if (this.ekycPushHandler === handler) {
        this.ekycPushHandler = null;
      }
    };
  }

  /**
   * Step 1: Request notification permission from user
   */
  async requestPermission() {
    try {
      console.log('🔔 Requesting notification permission...');

      if (Platform.OS === 'android') {
        const apiLevel = Number(Platform.Version);
        if (!Number.isNaN(apiLevel) && apiLevel >= 33) {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          const granted = result === PermissionsAndroid.RESULTS.GRANTED;
          console.log(
            granted
              ? '✅ Notification permission granted'
              : `⚠️ Notification permission: ${result}`,
          );
          return granted;
        }
        return true;
      }

      const systemGranted = await requestNotificationPermission();
      const authStatus = await requestPermission(getMessaging());
      const enabled = authStatus === AUTHORIZED || authStatus === PROVISIONAL;
      if (!systemGranted || !enabled) {
        console.log('❌ iOS Firebase notification permission denied');
        return false;
      }

      console.log('✅ Notification permission granted');
      return true;
    } catch (error) {
      console.error('❌ Permission request error:', error);
      return false;
    }
  }

  async ensureRemoteMessaging() {
    const messagingInstance = getMessaging();
    try {
      await setAutoInitEnabled(messagingInstance, true);
    } catch (error) {
      console.log('FCM auto-init skipped:', error?.message);
    }
    try {
      if (!isDeviceRegisteredForRemoteMessages(messagingInstance)) {
        await registerDeviceForRemoteMessages(messagingInstance);
      }
    } catch (error) {
      console.log('FCM device register skipped:', error?.message);
    }
    return messagingInstance;
  }

  /**
   * Step 2: Get FCM token from Firebase
   */
  async getFCMToken() {
    try {
      console.log('📱 Getting FCM token...');
      const messagingInstance = await this.ensureRemoteMessaging();

      if (Platform.OS === 'ios') {
        const apnsToken = await getAPNSToken(messagingInstance);
        if (!apnsToken) {
          console.log('❌ No APNS token found for iOS');
          return null;
        }
      }

      const token = await getToken(messagingInstance);

      if (token) {
        console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
        await AsyncStorage.setItem('fcmToken', token);
        return token;
      }
      console.log('❌ No FCM token available');
      return null;
    } catch (error) {
      console.error('❌ FCM Token error:', error);
      return null;
    }
  }

  /**
   * Step 3: Get or create unique device ID
   */
  async getOrCreateDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('deviceId');

      if (!deviceId) {
        // Generate unique device ID
        deviceId = await DeviceInfo.getUniqueId();
        await AsyncStorage.setItem('deviceId', deviceId);
        console.log('✅ New device ID created:', deviceId);
      } else {
        console.log('✅ Existing device ID:', deviceId);
      }

      return deviceId;
    } catch (error) {
      console.error('❌ Device ID error:', error);
      // Fallback to timestamp-based ID
      const fallbackId =
        'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await AsyncStorage.setItem('deviceId', fallbackId);
      return fallbackId;
    }
  }

  /**
   * Step 4: Register FCM token with server
   */
  async registerTokenWithServer(authToken) {
    try {
      console.log('📤 Registering token with server...');

      const token = await this.getFCMToken();
      if (!token) {
        console.log('❌ No FCM token available to register');
        return false;
      }

      const fingerprint = `${String(authToken || '').slice(-12)}:${token}`;
      const lastFingerprint = await AsyncStorage.getItem('fcmTokenFingerprint');
      if (lastFingerprint === fingerprint) {
        console.log('✅ FCM token already registered for this session');
        return true;
      }

      if (this.registerInFlight) {
        return this.registerInFlight;
      }

      this.registerInFlight = this.postTokenToServer(
        token,
        fingerprint,
        authToken,
      );
      try {
        return await this.registerInFlight;
      } finally {
        this.registerInFlight = null;
      }
    } catch (error) {
      console.error('❌ Token registration error:', error);
      return false;
    }
  }

  async postTokenToServer(token, fingerprint, authToken) {
    const deviceId = await this.getOrCreateDeviceId();
    const platform =
      Platform.OS === 'ios'
        ? 'IOS'
        : Platform.OS === 'android'
          ? 'ANDROID'
          : 'WEB';
    const jwt = authToken || (await AsyncStorage.getItem('userToken'));
    const payload = {
      token,
      device_id: deviceId,
      platform,
    };

    console.log('📤 POST /notifications/tokens', {
      device_id: deviceId,
      platform,
      token: `${token.substring(0, 16)}...`,
      hasAuth: Boolean(jwt),
    });

    const response = await fetch(getFullUrl('/notifications/tokens'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jwt ? {Authorization: `Bearer ${jwt}`} : {}),
      },
      body: JSON.stringify(payload),
    });
    let raw = null;
    try {
      raw = await response.json();
    } catch (error) {
      raw = null;
    }
    const envelope = normalizeEnvelope(raw, response.status);
    console.log('📥 FCM token API response', {
      http: response.status,
      success: envelope.success,
      message: envelope.message,
    });

    if (response.ok && envelope.success) {
      await AsyncStorage.setItem('tokenRegistered', 'true');
      await AsyncStorage.setItem('fcmTokenFingerprint', fingerprint);
      const tokenId = envelope.data?.id || envelope.data?.token_id;
      if (tokenId) {
        await AsyncStorage.setItem('fcmTokenId', String(tokenId));
      }
      console.log('✅ Token registered successfully with server');
      return true;
    }

    console.log('❌ Token registration failed:', envelope.message);
    return false;
  }

  /**
   * Login / register / OTP: POST FCM token immediately, then ask permission.
   */
  async registerAfterAuth(authToken) {
    try {
      const registered = await this.registerTokenWithServer(authToken);
      this.requestPermission().catch(error => {
        console.log('Notification permission after auth failed:', error?.message);
      });
      this.isInitialized = true;
      return registered;
    } catch (error) {
      console.log('FCM register after auth failed:', error?.message);
      return false;
    }
  }

  /**
   * Step 5: Complete initialization flow
   */
  async initialize(authToken) {
    try {
      console.log('🚀 Initializing notification service...');
      await this.requestPermission();

      if (authToken) {
        const registered = await this.registerTokenWithServer(authToken);
        if (!registered) {
          console.log(
            '⚠️ Token registration with server failed, but service is functional',
          );
        }
      } else {
        await this.getFCMToken();
      }

      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Notification service initialization error:', error);
      return false;
    }
  }

  /**
   * Step 6: Setup message handlers for notifications
   */
  setupMessageHandlers(navigation) {
    try {
      const messagingInstance = getMessaging();

      const unsubscribeForeground = onMessage(
        messagingInstance,
        async remoteMessage => {
          console.log('📱 Foreground message received:', remoteMessage);
          this.handleNotification(remoteMessage, navigation);
        },
      );

      const unsubscribeOpened = onNotificationOpenedApp(
        messagingInstance,
        remoteMessage => {
          console.log('📱 Notification opened app:', remoteMessage);
          this.navigateToScreen(remoteMessage, navigation);
        },
      );

      getInitialNotification(messagingInstance)
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('📱 Initial notification (app killed):', remoteMessage);
            this.navigateToScreen(remoteMessage, navigation);
          }
        })
        .catch(error => {
          console.log('⚠️ Initial notification check failed:', error);
        });

      const unsubscribeTokenRefresh = onTokenRefresh(
        messagingInstance,
        token => {
          console.log('🔄 Token refreshed:', token.substring(0, 20) + '...');
          this.handleTokenRefresh(token);
        },
      );

      return () => {
        safeUnsubscribe(unsubscribeForeground);
        safeUnsubscribe(unsubscribeOpened);
        safeUnsubscribe(unsubscribeTokenRefresh);
      };
    } catch (error) {
      console.error('❌ Failed to setup message handlers:', error);
      return () => {};
    }
  }

  /**
   * Step 7: Handle incoming notifications
   */
  handleNotification(remoteMessage, navigation) {
    const {title, body} = remoteMessage?.notification || {};
    const data = parseNotificationData(remoteMessage?.data);
    const type = data?.type || data?.event;

    console.log('🔔 Notification received:', {title, body, data});

    if (isEkycPushType(type) && typeof this.ekycPushHandler === 'function') {
      this.ekycPushHandler(type, data);
    }

    if (typeof this.foregroundBannerHandler === 'function') {
      this.foregroundBannerHandler({
        title: title || data.title || 'Notification',
        body: body || data.body || '',
        data,
        navigation,
      });
      return;
    }

    this.navigateToScreen(remoteMessage, navigation);
  }

  /**
   * Step 8: Navigate by FCM data.type + data.booking_id
   */
  navigateToScreen(remoteMessage, navigation) {
    const data = parseNotificationData(
      remoteMessage?.data || remoteMessage || {},
    );
    const type = data?.type || data?.event;
    console.log('🧭 Opening screen from push:', data);
    if (isEkycPushType(type) && typeof this.ekycPushHandler === 'function') {
      this.ekycPushHandler(type, data);
    }
    handleNotificationClick(data, navigation);
  }

  /**
   * Step 9: Handle token refresh
   */
  async handleTokenRefresh(newToken) {
    try {
      console.log('🔄 Handling token refresh...');

      // Update local storage
      await AsyncStorage.setItem('fcmToken', newToken);

      // Get auth token
      const authToken = await AsyncStorage.getItem('userToken');

      if (authToken) {
        // Register new token with server
        await this.registerTokenWithServer(authToken);
      }
    } catch (error) {
      console.error('❌ Token refresh handling error:', error);
    }
  }

  /**
   * Step 10: Logout - remove this device's FCM token
   */
  async handleLogout(authToken) {
    try {
      console.log('🚪 Handling logout - deactivating tokens...');

      if (authToken) {
        try {
          const deactivated = await apiRequest(
            '/notifications/tokens/deactivate-all',
            'POST',
          );
          if (!deactivated?.success) {
            const deviceId = await AsyncStorage.getItem('deviceId');
            if (deviceId) {
              await apiRequest(
                `/notifications/tokens/device/${deviceId}`,
                'DELETE',
              );
            } else {
              const tokenId = await AsyncStorage.getItem('fcmTokenId');
              if (tokenId) {
                await apiRequest(`/notifications/tokens/${tokenId}`, 'DELETE');
              }
            }
          }
          console.log('✅ Notification tokens deactivated on server');
        } catch (error) {
          console.log('⚠️ Token deactivation on server failed:', error);
        }
      }

      await Promise.all([
        AsyncStorage.removeItem('fcmToken'),
        AsyncStorage.removeItem('tokenRegistered'),
        AsyncStorage.removeItem('fcmTokenFingerprint'),
        AsyncStorage.removeItem('deviceId'),
        AsyncStorage.removeItem('fcmTokenId'),
      ]);

      this.isInitialized = false;
      console.log('✅ Logout handled successfully');
    } catch (error) {
      console.error('❌ Logout token handling error:', error);
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export default new NotificationService();
