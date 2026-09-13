import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Alert,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
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

        // Step 2: Initialize notification service
        console.log('🔔 Initializing notification service...');
        const notificationInitialized = await notificationService.initialize(
          token,
        );

        if (notificationInitialized) {
          console.log('✅ Notification service initialized');
        } else {
          console.log('⚠️ Notification service initialization failed');
        }

        // Step 3: Register FCM token with server
        console.log('📱 Registering FCM token with server...');
        const tokenRegistered = await notificationService.registerTokenWithServer(
          token,
        );

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <Loader visible={loading} />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={() => navigation?.goBack()}>
            <Icon name="arrow-back" size={22} color="#111820" />
          </TouchableOpacity>
          <Image source={require('../assets/auth.png')} style={styles.authImage} />
        </View>

        <Text style={styles.title}>Verify email</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to</Text>
        <Text style={styles.emailText}>{email}</Text>

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
              selectionColor="#008178"
              style={[
                styles.otpInput,
                value ? styles.otpInputFilled : null,
              ]}
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
            styles.primaryButton,
            !isOtpComplete && styles.primaryButtonDisabled,
          ]}>
          <Text style={styles.primaryButtonText}>Verify</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default VerifyPhoneScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 24,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
  },
  authImage: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111820',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#8190A7',
  },
  emailText: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
    color: '#111820',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 32,
    gap: 10,
  },
  otpInput: {
    width: 46,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#F6F6F6',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#111820',
    padding: 0,
  },
  otpInputFilled: {
    borderColor: '#008178',
    backgroundColor: '#E6F4F3',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: 14,
    color: '#8190A7',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008178',
  },
  resendLinkDisabled: {
    color: '#8190A7',
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  primaryButtonDisabled: {
    backgroundColor: '#B5C0D0',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
