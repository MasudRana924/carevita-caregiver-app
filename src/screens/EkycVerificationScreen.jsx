import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Linking,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import {caregiverService} from '../api/services';
import {unwrapData} from '../api/envelope';
import {useAuth} from '../context/AuthContext';
import Toast from '../components/common/Toast';
import {AUTH, authStyles} from '../components/auth/AuthShell';
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
  const {user, updateUser, logout, pendingEkyc, setPendingEkyc} = useAuth();
  const initialUrl = pendingEkyc?.verification_url || '';
  const [phase, setPhase] = useState(() => getInitialPhase(pendingEkyc, user));
  const [verificationUrl, setVerificationUrl] = useState(
    isEkycInReview(pendingEkyc) ? '' : initialUrl,
  );
  const [sessionStatus, setSessionStatus] = useState(
    getEkycSessionStatus(pendingEkyc) || getEkycSessionStatus(user) || null,
  );
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'error',
  });
  const handlingCallback = useRef(false);
  const startedRef = useRef(false);
  const statusRequestRef = useRef(null);

  const showError = message => {
    setToast({visible: true, message, type: 'error'});
  };

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
        ? 'Didit could not approve this session. Retry to start again.'
        : phase === 'in_review'
          ? 'Please wait until you get a response. We will let you continue after verification is approved.'
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
        {!!sessionStatus && (
          <Text style={styles.status}>Status: {sessionStatus}</Text>
        )}
        {checking ? (
          <ActivityIndicator style={styles.spinner} color={AUTH.button} />
        ) : null}
        {phase === 'in_review' ? (
          <TouchableOpacity
            style={authStyles.primaryButton}
            activeOpacity={0.85}
            onPress={fetchStatusOnce}
            disabled={checking}>
            <Text style={authStyles.primaryButtonText}>
              {checking ? 'Checking...' : 'Check status'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={authStyles.primaryButton}
            activeOpacity={0.85}
            onPress={startSession}>
            <Text style={authStyles.primaryButtonText}>
              {phase === 'pending' ? 'Continue verification' : 'Retry'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH.page} />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({...prev, visible: false}))}
      />
      {phase === 'webview' && verificationUrl ? (
        <View style={styles.flex}>
          <View style={styles.webHeader}>
            <Text style={styles.webTitle}>Identity verification</Text>
            <TouchableOpacity onPress={leaveWebView} hitSlop={8}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{uri: verificationUrl}}
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
          <ActivityIndicator size="large" color={AUTH.button} />
          <Text style={styles.body}>Starting identity verification...</Text>
        </View>
      ) : (
        renderStatus()
      )}
    </SafeAreaView>
  );
};

export default EkycVerificationScreen;

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: AUTH.page},
  flex: {flex: 1},
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
  },
  status: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
    color: AUTH.teal,
    textAlign: 'center',
  },
  spinner: {marginVertical: 18},
  logout: {alignItems: 'center', marginTop: 16},
  logoutText: {fontSize: 14, fontWeight: '600', color: AUTH.muted},
  webHeader: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E3EDE8',
  },
  webTitle: {fontSize: 16, fontWeight: '700', color: AUTH.title},
  closeText: {fontSize: 14, fontWeight: '700', color: AUTH.button},
});
