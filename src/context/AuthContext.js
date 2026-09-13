import React, {createContext, useState, useEffect, useContext} from 'react';
import {Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../services/notificationService';
import {authService, caregiverService} from '../api/services';

const AuthContext = createContext();

const hasProfilePayload = payload => {
  const profile = payload?.data;
  return Boolean(payload?.success && profile && (profile.id || profile.user_id));
};

export const AuthProvider = ({children}) => {
  const [userToken, setUserToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [caregiverProfile, setCaregiverProfile] = useState(null);
  const [hasCaregiverProfile, setHasCaregiverProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = async userData => {
    if (userData) {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    }
    setUser(userData);
  };

  const hydrateSession = async () => {
    try {
      const authProfile = await authService.getAuthProfile();
      const userData = authProfile?.user || authProfile?.data;
      if (userData?.role && userData.role !== 'CAREGIVER') {
        return {ok: false, reason: 'wrong_role'};
      }
      if (userData) {
        await persistUser(userData);
      }
    } catch (error) {
      if (error?.status === 401) {
        return {ok: false, reason: 'unauthorized'};
      }
      console.log('Auth profile hydrate failed:', error?.message);
    }

    try {
      const profileRes = await caregiverService.getMyProfile();
      if (profileRes?.status === 401) {
        return {ok: false, reason: 'unauthorized'};
      }
      if (hasProfilePayload(profileRes)) {
        setCaregiverProfile(profileRes.data);
        setHasCaregiverProfile(true);
      } else {
        setCaregiverProfile(null);
        setHasCaregiverProfile(false);
      }
    } catch (error) {
      if (error?.status === 401) {
        return {ok: false, reason: 'unauthorized'};
      }
      setCaregiverProfile(null);
      setHasCaregiverProfile(false);
    }

    return {ok: true};
  };

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken) {
          setUserToken(storedToken);
          setRefreshToken(storedRefreshToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          const result = await hydrateSession();
          if (result.reason === 'wrong_role' || result.reason === 'unauthorized') {
            await clearSession();
            if (result.reason === 'wrong_role') {
              Alert.alert(
                'Caregiver app',
                'This account is not a caregiver. Please use the family app or register as a caregiver.',
              );
            }
          }
        }
      } catch (error) {
        console.error('Failed to load token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
    // Session hydrate is mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearSession = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    setUserToken(null);
    setRefreshToken(null);
    setUser(null);
    setCaregiverProfile(null);
    setHasCaregiverProfile(false);
  };

  const login = async (token, refresh, userData) => {
    try {
      if (userData?.role && userData.role !== 'CAREGIVER') {
        Alert.alert(
          'Caregiver app',
          'This account is not a caregiver. Please use the family app or register as a caregiver.',
        );
        return false;
      }

      await AsyncStorage.setItem('userToken', token);
      if (refresh) {
        await AsyncStorage.setItem('refreshToken', refresh);
      }
      if (userData) {
        await persistUser(userData);
      }
      setUserToken(token);
      setRefreshToken(refresh);
      await hydrateSession();
      return true;
    } catch (error) {
      console.error('Failed to save token:', error);
      return false;
    }
  };

  const completeCaregiverProfile = profile => {
    setCaregiverProfile(profile);
    setHasCaregiverProfile(Boolean(profile));
  };

  const updateUser = async userData => {
    const next = {...(user || {}), ...(userData || {})};
    await persistUser(next);
  };

  const logout = async () => {
    try {
      console.log('🚪 Handling logout...');
      await notificationService.handleLogout(userToken);
      await clearSession();
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('Failed to remove token:', error);
      await clearSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userToken,
        refreshToken,
        user,
        caregiverProfile,
        hasCaregiverProfile,
        isLoading,
        login,
        logout,
        updateUser,
        completeCaregiverProfile,
        refreshSession: hydrateSession,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
