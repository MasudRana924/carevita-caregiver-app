import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from 'react';
import {Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../services/notificationService';
import {authService, caregiverService} from '../api/services';
import {setSessionExpiredHandler} from '../api/session';
import {isAuthFailure, unwrapData} from '../api/envelope';
import {applyEkycStatus, isEkycApproved, normalizeAuthUser, EKYC_REDIRECT_URL} from '../utils/ekyc';

const AuthContext = createContext();

const hasProfilePayload = payload => {
  const profile = unwrapData(payload);
  return Boolean(payload?.success && profile && (profile.id || profile.user_id));
};

export const AuthProvider = ({children}) => {
  const [userToken, setUserToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [caregiverProfile, setCaregiverProfile] = useState(null);
  const [hasCaregiverProfile, setHasCaregiverProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEkyc, setPendingEkyc] = useState(null);
  const logoutRef = useRef(async () => {});

  const persistUser = async userData => {
    if (userData) {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    }
    setUser(userData);
  };

  const clearSession = useCallback(async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    setUserToken(null);
    setRefreshToken(null);
    setUser(null);
    setCaregiverProfile(null);
    setHasCaregiverProfile(false);
    setPendingEkyc(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Handling logout...');
      await notificationService.handleLogout(userToken);
      await clearSession();
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('Failed to remove token:', error);
      await clearSession();
    }
  }, [clearSession, userToken]);

  logoutRef.current = logout;

  const hydrateSession = useCallback(async () => {
    try {
      const authProfile = await authService.getAuthProfile();
      let userData = normalizeAuthUser(unwrapData(authProfile)) || unwrapData(authProfile);
      if (userData?.role && userData.role !== 'CAREGIVER') {
        return {ok: false, reason: 'wrong_role'};
      }
      if (userData?.id || userData?.email) {
        try {
          const storedRaw = await AsyncStorage.getItem('user');
          const stored = storedRaw ? JSON.parse(storedRaw) : null;
          if (stored?.ekyc_status === true && userData.ekyc_status !== true) {
            userData = {
              ...userData,
              ekyc_status: true,
              ekyc_session_status:
                userData.ekyc_session_status || stored.ekyc_session_status,
              ekyc_verified_at:
                userData.ekyc_verified_at || stored.ekyc_verified_at,
            };
          }
        } catch (error) {
          // Keep freshly fetched profile if stored user cannot be read.
        }
        await persistUser(userData);
      }
    } catch (error) {
      if (isAuthFailure(error?.payload, error?.status)) {
        return {ok: false, reason: 'unauthorized'};
      }
      console.log('Auth profile hydrate failed:', error?.message);
    }

    try {
      const profileRes = await caregiverService.getMyProfile();
      if (isAuthFailure(profileRes, profileRes?.status || profileRes?.statusCode)) {
        return {ok: false, reason: 'unauthorized'};
      }
      if (hasProfilePayload(profileRes)) {
        setCaregiverProfile(unwrapData(profileRes));
        setHasCaregiverProfile(true);
      } else {
        setCaregiverProfile(null);
        setHasCaregiverProfile(false);
      }
    } catch (error) {
      if (isAuthFailure(error?.payload, error?.status)) {
        return {ok: false, reason: 'unauthorized'};
      }
      setCaregiverProfile(null);
      setHasCaregiverProfile(false);
    }

    return {ok: true};
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(async () => {
      await logoutRef.current();
    });
    return () => setSessionExpiredHandler(null);
  }, []);

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
  }, [clearSession, hydrateSession]);

  const login = async (token, refresh, userData) => {
    try {
      const authUser = normalizeAuthUser(userData) || userData;
      if (authUser?.role && authUser.role !== 'CAREGIVER') {
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
      if (authUser) {
        await persistUser(authUser);
      }

      await notificationService.registerAfterAuth(token);

      if (authUser?.ekyc_status !== true) {
        try {
          const ekycRes = await caregiverService.initiateEkyc(EKYC_REDIRECT_URL);
          const ekycData = unwrapData(ekycRes);
          if (ekycData.ekyc_status === true) {
            setPendingEkyc(null);
            await persistUser(applyEkycStatus(authUser, ekycData));
          } else {
            setPendingEkyc(ekycData);
            await persistUser(applyEkycStatus(authUser, ekycData));
          }
        } catch (error) {
          console.log('eKYC initiate after login failed:', error?.message);
          setPendingEkyc({error: error?.message || 'eKYC start failed'});
        }
      } else {
        setPendingEkyc(null);
      }

      setUserToken(token);
      setRefreshToken(refresh);
      if (authUser?.ekyc_status === true) {
        await hydrateSession();
      }
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
    let previous = user;
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        previous = JSON.parse(stored);
      }
    } catch (error) {
      previous = user;
    }
    const next = {...(previous || {}), ...(userData || {})};
    await persistUser(next);
  };

  const applyEkycPush = useCallback(async (type, data = {}) => {
    const normalized = String(type || data?.type || data?.event || '').toUpperCase();
    if (normalized === 'EKYC_APPROVED') {
      setPendingEkyc(null);
      await updateUser(
        applyEkycStatus(null, {
          ...data,
          ekyc_status: true,
          ekyc_session_status: data.ekyc_session_status || 'Approved',
        }),
      );
      await hydrateSession();
      return 'approved';
    }
    if (normalized === 'EKYC_DECLINED') {
      await updateUser(
        applyEkycStatus(null, {
          ...data,
          ekyc_status: false,
          ekyc_session_status: data.ekyc_session_status || 'Declined',
        }),
      );
      return 'declined';
    }
    return null;
  }, [hydrateSession, updateUser]);

  return (
    <AuthContext.Provider
      value={{
        userToken,
        refreshToken,
        user,
        caregiverProfile,
        hasCaregiverProfile,
        isLoading,
        isEkycVerified: isEkycApproved(user),
        pendingEkyc,
        setPendingEkyc,
        login,
        logout,
        updateUser,
        applyEkycPush,
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
