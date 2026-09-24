import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator, BottomTabBar} from '@react-navigation/bottom-tabs';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import {useAuth} from '../context/AuthContext';
import {useInboxUnreadCount} from '../api/queries';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import CreateAccountScreen from '../screens/CreateAccountScreen';
import VerifyPhoneScreen from '../screens/VerifyPhoneScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfile from '../screens/EditProfile';
import BookingsScreen from '../screens/BookingsScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import InboxScreen from '../screens/InboxScreen';
import ConversationListScreen from '../screens/ConversationListScreen';
import ConversationDetailScreen from '../screens/ConversationDetailScreen';
import WalletScreen from '../screens/WalletScreen';
import CaregiverProfileScreen from '../screens/CaregiverProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import AvailabilityScreen from '../screens/AvailabilityScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';
import EkycVerificationScreen from '../screens/EkycVerificationScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import WithdrawDetailsScreen from '../screens/WithdrawDetailsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function FloatingTabBar(props) {
  const {width: windowWidth} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarWidth = Math.round(windowWidth * 0.9);

  return (
    <View pointerEvents="box-none" style={[styles.tabBarHost, {bottom: insets.bottom + 16}]}>
      <View style={[styles.tabBarShell, styles.glassEffect, {width: tabBarWidth}]}>
        <BottomTabBar {...props} style={styles.tabBarInner} />
      </View>
    </View>
  );
}

function MainTabs() {
  const {data: unreadData} = useInboxUnreadCount();
  const unread = unreadData?.unread ?? unreadData?.data?.unread ?? 0;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={tabProps => <FloatingTabBar {...tabProps} />}
      screenOptions={{
        headerShown: false,
        safeAreaInsets: {bottom: 0},
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 4,
        },
        tabBarActiveTintColor: '#008178',
        tabBarInactiveTintColor: '#7D8BA2',
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({focused, color}) => (
            <Icon
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarIcon: ({focused, color}) => (
            <Icon
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: {backgroundColor: '#E34242', fontSize: 10},
          tabBarIcon: ({focused, color}) => (
            <Icon
              name={focused ? 'mail' : 'mail-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({focused, color}) => (
            <Icon
              name={focused ? 'wallet' : 'wallet-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({focused, color}) => (
            <Icon
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const {userToken, isLoading, isEkycVerified} = useAuth();

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#008178" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      {userToken ? (
        !isEkycVerified ? (
          <Stack.Screen
            name="EkycVerification"
            component={EkycVerificationScreen}
            options={{gestureEnabled: false}}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{gestureEnabled: false}}
            />
            <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen
              name="CaregiverProfile"
              component={CaregiverProfileScreen}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
            />
            <Stack.Screen name="Availability" component={AvailabilityScreen} />
            <Stack.Screen name="Reviews" component={ReviewsScreen} />
            <Stack.Screen name="Withdraw" component={WithdrawScreen} />
            <Stack.Screen
              name="WithdrawDetails"
              component={WithdrawDetailsScreen}
            />
            <Stack.Screen
              name="NotificationPreferences"
              component={NotificationPreferencesScreen}
            />
            <Stack.Screen
              name="ConversationList"
              component={ConversationListScreen}
            />
            <Stack.Screen
              name="ConversationDetail"
              component={ConversationDetailScreen}
            />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={CreateAccountScreen} />
          <Stack.Screen name="VerifyPhone" component={VerifyPhoneScreen} />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const styles = StyleSheet.create({
  tabBarHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tabBarShell: {
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(243, 248, 246, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(227, 237, 232, 0.8)',
    overflow: 'hidden',
    // elevation: 12,
    // shadowColor: '#0E2A24',
    // shadowOffset: {width: 0, height: 8},
    // shadowOpacity: 0.15,
    // shadowRadius: 16,
  },
  glassEffect: {
    ...Platform.select({
      ios: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
      android: {
        backgroundColor: 'rgba(243, 248, 246, 0.95)',
      },
    }),
  },
  tabBarInner: {
    flex: 1,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
});

export default AppNavigator;
