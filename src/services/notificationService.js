import {
  getMessaging,
  getToken,
  getAPNSToken,
  requestPermission,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {apiRequest} from './api';
import {requestNotificationPermission} from '../utils/permissions';
import {
  handleNotificationClick,
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
  }

  setForegroundBannerHandler(handler) {
    this.foregroundBannerHandler = handler;
    return () => {
      if (this.foregroundBannerHandler === handler) {
        this.foregroundBannerHandler = null;
      }
    };
  }

  /**
   * Step 1: Request notification permission from user
   */
  async requestPermission() {
    try {
      console.log('🔔 Requesting notification permission...');

      const systemGranted = await requestNotificationPermission();
      if (!systemGranted) {
        console.log('❌ Notification permission denied');
        return false;
      }

      if (Platform.OS === 'ios') {
        const authStatus = await requestPermission(getMessaging());
        const enabled = authStatus === AUTHORIZED || authStatus === PROVISIONAL;
        if (!enabled) {
          console.log('❌ iOS Firebase notification permission denied');
          return false;
        }
      }

      console.log('✅ Notification permission granted');
      return true;
    } catch (error) {
      console.error('❌ Permission request error:', error);
      return false;
    }
  }

  /**
   * Step 2: Get FCM token from Firebase
   */
  async getFCMToken() {
    try {
      console.log('📱 Getting FCM token...');

      // Check if we have apns token for iOS
      const messagingInstance = getMessaging();

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
      } else {
        console.log('❌ No FCM token available');
        return null;
      }
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

      const deviceId = await this.getOrCreateDeviceId();
      const platform =
        Platform.OS === 'ios'
          ? 'IOS'
          : Platform.OS === 'android'
            ? 'ANDROID'
            : 'WEB';

      const response = await apiRequest(
        '/notifications/tokens',
        'POST',
        {
          token: token,
          device_id: deviceId,
          platform,
        },
        false,
      );

      if (response.success) {
        console.log('✅ Token registered successfully with server');
        await AsyncStorage.setItem('tokenRegistered', 'true');
        if (response.data?.id) {
          await AsyncStorage.setItem('fcmTokenId', response.data.id);
        }
        return true;
      } else {
        console.log('❌ Token registration failed:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Token registration error:', error);
      return false;
    }
  }

  /**
   * Step 5: Complete initialization flow
   */
  async initialize(authToken) {
    try {
      if (this.isInitialized) {
        console.log('⚠️ Notification service already initialized');
        return true;
      }

      console.log('🚀 Initializing notification service...');

      // Step 1: Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('❌ Notification permission not granted');
        return false;
      }

      // Step 2: Get FCM token
      const token = await this.getFCMToken();
      if (!token) {
        console.log('❌ Failed to get FCM token');
        return false;
      }

      // Step 3: Register with server (if auth token provided)
      if (authToken) {
        const registered = await this.registerTokenWithServer(authToken);
        if (!registered) {
          console.log(
            '⚠️ Token registration with server failed, but service is functional',
          );
        }
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

    console.log('🔔 Notification received:', {title, body, data});

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
    console.log('🧭 Opening screen from push:', data);
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
