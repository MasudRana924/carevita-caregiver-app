import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';
import { caregiverService } from '../api/services';
import { unwrapData } from '../api/envelope';
import { useAuth } from '../context/AuthContext';
import { showError } from '../context/ErrorModalContext';
import Loader from '../components/common/Loader';
import AppButton from '../components/common/AppButton';
import {AUTH} from '../components/auth/AuthShell';
import {
  EKYC_REDIRECT_URL,
  applyEkycStatus,
  getApiErrorText,
  getEkycSessionStatus,
  isEkycApproved,
  isEkycCallbackUrl,
  isEkycDeclined,
  isEkycInReview,
} from '../utils/ekyc';
import {
  requestCameraPermission,
  requestMicrophonePermission,
} from '../utils/permissions';

const getInitialPhase = (pendingEkyc, user) => {
  if (isEkycInReview(pendingEkyc) || isEkycInReview(user)) {
    return 'in_review';
  }
  if (pendingEkyc?.verification_url) {
    return 'webview';
  }
  return 'loading';
};

const EkycVerificationScreen = () => {
  const { user, updateUser, logout, pendingEkyc, setPendingEkyc } = useAuth();
  const initialUrl = pendingEkyc?.verification_url || '';
  const [phase, setPhase] = useState(() => getInitialPhase(pendingEkyc, user));
  const [verificationUrl, setVerificationUrl] = useState(
    isEkycInReview(pendingEkyc) ? '' : initialUrl,
  );
  const [sessionStatus, setSessionStatus] = useState(
    getEkycSessionStatus(pendingEkyc) || getEkycSessionStatus(user) || null,
  );
  const [checking, setChecking] = useState(false);
  const handlingCallback = useRef(false);
  const startedRef = useRef(false);
  const statusRequestRef = useRef(null);

  const markApproved = useCallback(
    async payload => {
      const next = applyEkycStatus(user, {
        ...(payload || {}),
        ekyc_status: true,
      });
      setPendingEkyc?.(null);
      await updateUser(next);
    },
    [setPendingEkyc, updateUser, user],
  );

  const applySessionPayload = useCallback(
    async (data, message) => {
      const status = getEkycSessionStatus(data);
      setSessionStatus(status);
      setPendingEkyc?.(data);
      await updateUser(applyEkycStatus(user, data));

      if (data?.ekyc_status === true) {
        await markApproved(data);
        return 'approved';
      }
      if (isEkycDeclined(status)) {
        setVerificationUrl('');
        setPhase('declined');
        showError(message || 'Identity verification was declined.');
        return 'declined';
      }
      if (isEkycInReview(status)) {
        setVerificationUrl('');
        setPhase('in_review');
        return 'in_review';
      }
      return 'pending';
    },
    [markApproved, setPendingEkyc, updateUser, user],
  );

  const openVerificationUrl = useCallback(url => {
    if (!url) {
      return false;
    }
    setVerificationUrl(url);
    setPhase('webview');
    return true;
  }, []);

  const fetchStatusOnce = useCallback(async () => {
    if (statusRequestRef.current) {
      return statusRequestRef.current;
    }
    setChecking(true);
    const request = (async () => {
      try {
        const response = await caregiverService.getEkycStatus();
        const data = unwrapData(response);
        return applySessionPayload(data, response.message);
      } catch (error) {
        showError(getApiErrorText(error));
        setPhase(current => (current === 'webview' ? current : 'error'));
        return 'error';
      } finally {
        statusRequestRef.current = null;
        setChecking(false);
      }
    })();
    statusRequestRef.current = request;
    return request;
  }, [applySessionPayload]);

  const startSession = useCallback(async () => {
    try {
      const pendingStatus = getEkycSessionStatus(pendingEkyc);
      if (isEkycInReview(pendingStatus) || isEkycInReview(user)) {
        setSessionStatus(pendingStatus || getEkycSessionStatus(user));
        setVerificationUrl('');
        setPhase('in_review');
        return;
      }

      const pendingUrl = pendingEkyc?.verification_url;
      if (pendingUrl) {
        setSessionStatus(pendingStatus);
        await Promise.all([
          requestCameraPermission(),
          requestMicrophonePermission(),
        ]);
        openVerificationUrl(pendingUrl);
        return;
      }

      setPhase('loading');
      await Promise.all([
        requestCameraPermission(),
        requestMicrophonePermission(),
      ]);

      const response = await caregiverService.initiateEkyc(EKYC_REDIRECT_URL);
      const data = unwrapData(response);
      const result = await applySessionPayload(data, response.message);

      if (result === 'approved' || result === 'declined' || result === 'in_review') {
        return;
      }

      if (openVerificationUrl(data.verification_url)) {
        return;
      }

      setPhase('error');
      showError(response.message || 'Verification URL was not returned.');
    } catch (error) {
      setPhase('error');
      showError(getApiErrorText(error));
    }
  }, [
    applySessionPayload,
    openVerificationUrl,
    pendingEkyc,
    user,
  ]);

  const handleCallback = useCallback(async () => {
    if (handlingCallback.current) {
      return;
    }
    handlingCallback.current = true;
    setVerificationUrl('');
    setPhase('loading');
    await fetchStatusOnce();
    handlingCallback.current = false;
  }, [fetchStatusOnce]);

  const leaveWebView = useCallback(async () => {
    setVerificationUrl('');
    setPhase('loading');
    const result = await fetchStatusOnce();
    if (result === 'pending') {
      setPhase('pending');
    }
  }, [fetchStatusOnce]);

  useEffect(() => {
    if (isEkycApproved(user)) {
      return;
    }
    if (isEkycDeclined(user)) {
      setVerificationUrl('');
      setSessionStatus(getEkycSessionStatus(user) || 'Declined');
      setPhase('declined');
    }
  }, [user]);

  useEffect(() => {
    if (startedRef.current || isEkycApproved(user)) {
      return;
    }
    startedRef.current = true;
    if (isEkycInReview(pendingEkyc) || isEkycInReview(user)) {
      setPhase('in_review');
      return;
    }
    startSession();
  }, [pendingEkyc, startSession, user]);

  useEffect(() => {
    const sub = Linking.addEventListener('url', event => {
      if (isEkycCallbackUrl(event?.url)) {
        handleCallback();
      }
    });
    return () => sub.remove();
  }, [handleCallback]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'webview') {
        leaveWebView();
      }
      return true;
    });
    return () => sub.remove();
  }, [leaveWebView, phase]);

  const interceptUrl = request => {
    const requestUrl = request?.url || request;
    if (isEkycCallbackUrl(requestUrl)) {
      handleCallback();
      return false;
    }
    return true;
  };

  const renderStatus = () => {
    const title =
      phase === 'declined'
        ? 'Verification declined'
        : phase === 'in_review'
          ? 'Verification in review'
          : phase === 'error'
            ? 'Verification needed'
            : 'Verify identity to continue';
    const body =
      phase === 'declined'
        ? 'Your identity could not be approved. Please retry verification or contact support if this keeps happening.'
        : phase === 'in_review'
          ? 'Your identity is being reviewed. Please wait until you get a response. You can continue using the app once verification is approved.'
          : phase === 'pending'
            ? 'Finish identity verification to continue.'
            : 'Complete identity verification to continue.';

    return (
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Icon
            name={
              phase === 'in_review' ? 'time-outline' : 'shield-checkmark-outline'
            }
            size={32}
            color={AUTH.teal}
          />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {phase === 'in_review' ? (
          <AppButton
            title="Check status"
            onPress={fetchStatusOnce}
            disabled={checking}
          />
        ) : (
          <AppButton
            title={phase === 'pending' ? 'Continue verification' : 'Retry'}
            onPress={startSession}
          />
        )}
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const showWebView = phase === 'webview' && !!verificationUrl;

  return (
    <SafeAreaView
      style={styles.safe}
      edges={
        showWebView
          ? ['bottom', 'left', 'right']
          : ['top', 'left', 'right', 'bottom']
      }>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH.page} />
      {showWebView ? (
        <View style={styles.flex}>
          <Header
            title="Identity verification"
            onBack={leaveWebView}
          />
          <WebView
            source={{ uri: verificationUrl }}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            mediaCapturePermissionGrantType="grant"
            originWhitelist={['*']}
            onShouldStartLoadWithRequest={interceptUrl}
          />
        </View>
      ) : phase === 'loading' ? (
        <View style={styles.center}>
          <Text style={styles.body}>Starting identity verification...</Text>
        </View>
      ) : (
        renderStatus()
      )}
      <Loader visible={checking || phase === 'loading'} overlay />
    </SafeAreaView>
  );
};

export default EkycVerificationScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AUTH.page },
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AUTH.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: AUTH.title,
    textAlign: 'center',
  },
  body: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: AUTH.muted,
    textAlign: 'center',
    marginBottom: 22,
  },
  logout: {alignItems: 'center', marginTop: 16},
  logoutText: { fontSize: 14, fontWeight: '600', color: AUTH.muted },
});
