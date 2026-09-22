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
import AuthShell, {AUTH, authStyles} from '../components/auth/AuthShell';
import {verifyOtp, resendOtp, extractAuthPayload} from '../services/api';
import {useAuth} from '../context/AuthContext';
import notificationService from '../services/notificationService';
import {showError} from '../context/ErrorModalContext';
import {showAlert} from '../context/AlertModalContext';

const OTP_LENGTH = 4;

const VerifyPhoneScreen = ({navigation, route}) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [seconds, setSeconds] = useState(42);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);
  const {login} = useAuth();
  const email = route?.params?.email || '';

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const handleOtpChange = (value, index) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (!numericValue) {
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    newOtp[index] = numericValue.charAt(numericValue.length - 1);
    setOtp(newOtp);

    if (index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    } else {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = ({nativeEvent}, index) => {
    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (seconds > 0 || resending) {
      return;
    }
    setResending(true);
    try {
      const response = await resendOtp(email);
      if (response.success) {
        setSeconds(42);
        showAlert('Success', 'OTP has been resent to your email');
      } else {
        showError(response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      showError('Something went wrong. Please try again.');
      console.error('Resend OTP error:', error);
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== OTP_LENGTH) {
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Verifying OTP...');
      const response = await verifyOtp(email, enteredOtp);

      const {token, refreshToken, user} = extractAuthPayload(response);
      if (response.success && token) {
        console.log('✅ OTP verification response received');

        const loggedIn = await login(token, refreshToken, user);
        if (!loggedIn) {
          return;
        }
        console.log('✅ Auth tokens stored locally');
        await notificationService.registerAfterAuth(token);
      } else {
        const code = String(response?.code || '').toUpperCase();
        showError(
          response.message ||
            (code === 'OTP_INVALID'
              ? 'The OTP you entered is invalid. Please try again.'
              : 'OTP verification failed'),
          code === 'OTP_INVALID' ? 'Invalid OTP' : 'Error',
        );
      }
    } catch (error) {
      const code = String(error?.code || '').toUpperCase();
      showError(
        error?.message ||
          (code === 'OTP_INVALID'
            ? 'The OTP you entered is invalid. Please try again.'
            : 'Something went wrong. Please try again.'),
        code === 'OTP_INVALID' ? 'Invalid OTP' : 'Error',
      );
      console.error('❌ Verify OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOtpComplete = otp.every(value => value !== '');

  return (
    <AuthShell
      navigation={navigation}
      showBack
      title="Verify email"
      subtitle={`We sent a 4-digit code to ${email || 'your email'}.`}>
      <Loader visible={loading || resending} overlay />

      <Text style={authStyles.label}>Enter OTP</Text>
      <View style={styles.otpContainer}>
        {otp.map((value, index) => (
          <TextInput
            key={index}
            ref={ref => {
              inputs.current[index] = ref;
            }}
            value={value}
            onChangeText={text => handleOtpChange(text, index)}
            onKeyPress={event => handleKeyPress(event, index)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            selectionColor={AUTH.teal}
            style={[styles.otpInput, value ? styles.otpInputFilled : null]}
          />
        ))}
      </View>

      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn't get the code? </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={seconds > 0 || resending}
          onPress={handleResend}>
          <Text
            style={[
              styles.resendLink,
              seconds > 0 && styles.resendLinkDisabled,
            ]}>
            {resending
              ? 'Sending...'
              : seconds > 0
                ? `Resend in 0:${String(seconds).padStart(2, '0')}`
                : 'Resend'}
          </Text>
        </TouchableOpacity>
      </View>

      <AppButton
        title="Verify"
        onPress={handleVerify}
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
    marginBottom: 18,
  },
  otpInput: {
    width: 60,
    height:60,
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
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: 14,
    color: AUTH.muted,
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
