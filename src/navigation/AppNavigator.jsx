import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import {useAuth} from '../context/AuthContext';
import {useInboxUnreadCount} from '../api/queries';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import CreateAccountScreen from '../screens/CreateAccountScreen';
import VerifyPhoneScreen from '../screens/VerifyPhoneScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfile from '../screens/EditProfile';
import BookingsScreen from '../screens/BookingsScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import InboxScreen from '../screens/InboxScreen';
import WalletScreen from '../screens/WalletScreen';
import CaregiverProfileScreen from '../screens/CaregiverProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 12;
  const {data: unreadData} = useInboxUnreadCount();
  const unread = unreadData?.unread ?? unreadData?.data?.unread ?? 0;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        safeAreaInsets: {bottom: 0},
        tabBarStyle: {
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E3E8F0',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
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
  const {userToken, isLoading, hasCaregiverProfile} = useAuth();

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
        hasCaregiverProfile ? (
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
          </>
        ) : (
          <Stack.Screen
            name="CaregiverProfileSetup"
            component={CaregiverProfileScreen}
            initialParams={{mode: 'setup'}}
            options={{gestureEnabled: false}}
          />
        )
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={CreateAccountScreen} />
          <Stack.Screen name="VerifyPhone" component={VerifyPhoneScreen} />
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

export default AppNavigator;
