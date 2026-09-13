import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
import AuthShell, {AUTH, authStyles} from '../components/auth/AuthShell';
import {verifyOtp, resendOtp, extractAuthPayload} from '../services/api';
import {useAuth} from '../context/AuthContext';
import notificationService from '../services/notificationService';

const OTP_LENGTH = 6;

const VerifyPhoneScreen = ({navigation, route}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
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
        Alert.alert('Success', 'OTP has been resent to your email');
      } else {
        Alert.alert('Error', response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
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

        console.log('🔔 Initializing notification service...');
        const notificationInitialized = await notificationService.initialize(
          token,
        );

        if (notificationInitialized) {
          console.log('✅ Notification service initialized');
        } else {
          console.log('⚠️ Notification service initialization failed');
        }

        console.log('📱 Registering FCM token with server...');
        const tokenRegistered =
          await notificationService.registerTokenWithServer(token);

        if (tokenRegistered) {
          console.log('✅ FCM token registered successfully');
        } else {
          console.log('⚠️ FCM token registration failed');
        }
      } else {
        Alert.alert('Error', response.message || 'OTP verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
      title={'Verify\nemail'}
      subtitle={`We sent a 6-digit code to ${email || 'your email'}.`}>
      <Loader visible={loading} />

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

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={!isOtpComplete || loading}
        onPress={handleVerify}
        style={[
          authStyles.primaryButton,
          !isOtpComplete && authStyles.primaryButtonDisabled,
        ]}>
        <Icon name="arrow-forward" size={18} color="#FFFFFF" />
        <Text style={authStyles.primaryButtonText}>Verify</Text>
      </TouchableOpacity>
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
    width: 46,
    height: 54,
    borderRadius: 16,
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
