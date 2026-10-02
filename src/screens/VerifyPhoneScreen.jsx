import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from 'react-native';
import Loader from '../components/common/Loader';
import AppButton from '../components/common/AppButton';
import AuthShell, {AUTH} from '../components/auth/AuthShell';
import {verifyOtp, resendOtp, extractAuthPayload} from '../services/api';
import {useAuth} from '../context/AuthContext';
import notificationService from '../services/notificationService';
import {showError} from '../context/ErrorModalContext';
import {showAlert} from '../context/AlertModalContext';
import {buildAuthIdentifier, maskContact} from '../utils/authContact';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 60;

const emptyOtp = () => Array.from({length: OTP_LENGTH}, () => '');

const waitSecondsFromMessage = message => {
  const match = String(message || '').match(/(\d+)/);
  const seconds = match ? Number(match[1]) : 0;
  return seconds > 0 && seconds <= 300 ? seconds : RESEND_SECONDS;
};

const VerifyPhoneScreen = ({navigation, route}) => {
  const params = route?.params || {};
  const channel =
    params.channel === 'phone' || (!params.channel && params.phone)
      ? 'phone'
      : 'email';
  const value =
    params.value || (channel === 'phone' ? params.phone : params.email) || '';

  const [otp, setOtp] = useState(emptyOtp);
  const [otpError, setOtpError] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);
  const otpRef = useRef(emptyOtp());
  const submitting = useRef(false);
  const {login} = useAuth();

  const commitOtp = next => {
    otpRef.current = next;
    setOtp(next);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async code => {
    const enteredOtp = code || otpRef.current.join('');
    if (enteredOtp.length !== OTP_LENGTH || submitting.current) {
      return;
    }

    submitting.current = true;
    setLoading(true);
    setOtpError('');
    try {
      const response = await verifyOtp({
        otp: enteredOtp,
        ...buildAuthIdentifier(channel, value),
      });

      if (response.success) {
        const {token, refreshToken, user} = extractAuthPayload(response);
        if (!token) {
          showError(response.message || 'OTP verification failed');
          return;
        }
        const loggedIn = await login(token, refreshToken, user);
        if (!loggedIn) {
          return;
        }
        await notificationService.registerAfterAuth(token);
        return;
      }

      const status = response.status || response.statusCode;
      const responseCode = String(response.code || '').toUpperCase();

      if (responseCode === 'OTP_INVALID') {
        commitOtp(emptyOtp());
        setOtpError('Invalid OTP');
        inputs.current[0]?.focus();
        return;
      }
      if (responseCode === 'NOT_FOUND' || status === 404) {
        showAlert('User not found', response.message || 'User not found', [
          {text: 'OK', onPress: () => navigation?.replace('Register')},
        ]);
        return;
      }
      if (responseCode === 'CONFLICT' || status === 409) {
        showAlert(
          'Already verified',
          response.message || 'This account is already verified.',
          [{text: 'Log in', onPress: () => navigation?.replace('Login')}],
        );
        return;
      }
      if (responseCode === 'TOO_MANY_REQUESTS' || status === 429) {
        commitOtp(emptyOtp());
        setSeconds(0);
        showError(
          response.message ||
            'Too many wrong codes. Tap Resend and try again.',
        );
        return;
      }

      showError(response.message || 'OTP verification failed');
    } catch (error) {
      showError(
        error?.message || 'Something went wrong. Please try again.',
        'Error',
      );
      console.error('Verify OTP error:', error);
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const applyDigits = (digits, startIndex) => {
    const next = [...otpRef.current];
    const chars = digits.slice(0, OTP_LENGTH - startIndex).split('');
    chars.forEach((char, offset) => {
      next[startIndex + offset] = char;
    });
    commitOtp(next);
    setOtpError('');
    const lastIndex = startIndex + chars.length - 1;
    if (next.every(Boolean)) {
      Keyboard.dismiss();
      handleVerify(next.join(''));
      return;
    }
    const focusAt = Math.min(lastIndex + 1, OTP_LENGTH - 1);
    inputs.current[focusAt]?.focus();
  };

  const handleOtpChange = (text, index) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (!numericValue) {
      const next = [...otpRef.current];
      next[index] = '';
      commitOtp(next);
      return;
    }
    applyDigits(numericValue, index);
  };

  const handleKeyPress = ({nativeEvent}, index) => {
    if (nativeEvent.key === 'Backspace' && !otpRef.current[index] && index > 0) {
      const next = [...otpRef.current];
      next[index - 1] = '';
      commitOtp(next);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (seconds > 0 || resending || loading) {
      return;
    }
    setResending(true);
    try {
      const response = await resendOtp(buildAuthIdentifier(channel, value));
      if (response.success) {
        setSeconds(RESEND_SECONDS);
        commitOtp(emptyOtp());
        setOtpError('');
        return;
      }
      const status = response.status || response.statusCode;
      const responseCode = String(response.code || '').toUpperCase();
      if (responseCode === 'TOO_MANY_REQUESTS' || status === 429) {
        setSeconds(waitSecondsFromMessage(response.message));
      }
      showError(response.message || 'Failed to resend OTP');
    } catch (error) {
      showError('Something went wrong. Please try again.');
      console.error('Resend OTP error:', error);
    } finally {
      setResending(false);
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');
  const countdown = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const masked = maskContact(channel, value);

  return (
    <AuthShell
      navigation={navigation}
      showBack
      title="Verify OTP"
      subtitle={`Enter the 4-digit code for ${masked}`}>
      <Loader visible={loading || resending} overlay />

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => {
              inputs.current[index] = ref;
            }}
            value={digit}
            onChangeText={text => handleOtpChange(text, index)}
            onKeyPress={event => handleKeyPress(event, index)}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            textAlign="center"
            editable={!loading}
            selectionColor={AUTH.teal}
            style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
          />
        ))}
      </View>

      <Text style={styles.hint}>Use code 1234</Text>
      {otpError ? <Text style={styles.otpError}>{otpError}</Text> : null}

      <View style={styles.resendRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={seconds > 0 || resending || loading}
          onPress={handleResend}>
          <Text
            style={[
              styles.resendLink,
              (seconds > 0 || resending) && styles.resendLinkDisabled,
            ]}>
            {resending
              ? 'Resending...'
              : seconds > 0
                ? `Resend in ${countdown}`
                : 'Resend'}
          </Text>
        </TouchableOpacity>
      </View>

      <AppButton
        title="Verify"
        onPress={() => handleVerify()}
        disabled={!isOtpComplete || loading}
      />
    </AuthShell>
  );
};

export default VerifyPhoneScreen;

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  otpInput: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EDE8',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: AUTH.title,
    padding: 0,
  },
  otpInputFilled: {
    borderColor: AUTH.teal,
    backgroundColor: '#E7F6F3',
  },
  hint: {
    fontSize: 13,
    color: AUTH.muted,
    textAlign: 'center',
    marginBottom: 8,
  },
  otpError: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH.teal,
  },
  resendLinkDisabled: {
    color: AUTH.muted,
  },
});
