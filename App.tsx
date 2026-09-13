/**
 * Nirapod - Professional Care App
 *
 * @format
 */

import React, {useState, useCallback, useEffect, useRef} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import notificationService from './src/services/notificationService';
import {NavigationContainer} from '@react-navigation/native';
import NotificationBanner from './src/components/common/NotificationBanner';
import {handleNotificationClick, parseNotificationData} from './src/utils/notificationHandler';
import {queryKeys} from './src/api/queryKeys';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppContent() {
  const {isLoading, userToken} = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const navigationRef = useRef<any>(null);
  const listenersCleanupRef = useRef<(() => void) | null>(null);
  const [banner, setBanner] = useState({
    visible: false,
    title: '',
    body: '',
    data: null as any,
  });

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  const setupNotificationListeners = useCallback(() => {
    if (typeof listenersCleanupRef.current === 'function') {
      listenersCleanupRef.current();
    }
    listenersCleanupRef.current = notificationService.setupMessageHandlers(
      navigationRef.current,
    );
  }, []);

  useEffect(() => {
    const unsubscribe = notificationService.setForegroundBannerHandler(
      payload => {
        queryClient.invalidateQueries({queryKey: queryKeys.inbox.all});
        queryClient.invalidateQueries({queryKey: queryKeys.bookings.all});
        queryClient.invalidateQueries({queryKey: queryKeys.wallet.all});
        setBanner({
          visible: true,
          title: payload?.title || 'Notification',
          body: payload?.body || '',
          data: payload?.data || null,
        });
      },
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      if (typeof listenersCleanupRef.current === 'function') {
        listenersCleanupRef.current();
      }
    };
  }, []);

  // Initialize notifications when user logs in.
  // Do not call handleLogout on the initial null token — that runs on every app launch.
  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (userToken) {
      notificationService.initialize(userToken).catch((error: any) => {
        console.error('Failed to initialize notifications:', error);
      });
    }
  }, [userToken, isLoading]);

  // Keep splash visible until auth is ready AND splash timer finishes
  if (showSplash || isLoading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <>
      <NavigationContainer ref={navigationRef} onReady={setupNotificationListeners}>
        <AppNavigator />
      </NavigationContainer>
      <NotificationBanner
        visible={banner.visible}
        title={banner.title}
        body={banner.body}
        onHide={() => setBanner(prev => ({...prev, visible: false}))}
        onPress={() => {
          const nav = navigationRef.current;
          if (nav) {
            handleNotificationClick(
              parseNotificationData(banner.data),
              nav,
            );
          }
        }}
      />
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
