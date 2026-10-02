import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {showAlert} from '../context/AlertModalContext';
import {showError} from '../context/ErrorModalContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import AuthShell, {AUTH, authStyles} from '../components/auth/AuthShell';
import {
  AuthChannelToggle,
  PhoneField,
} from '../components/auth/AuthMethodFields';
import {loginUser, resendOtp, extractAuthPayload} from '../services/api';
import {useAuth} from '../context/AuthContext';
import notificationService from '../services/notificationService';
import {
  PHONE_ERROR,
  buildAuthIdentifier,
  normalizeBdMobile,
  toPhoneFieldValue,
} from '../utils/authContact';

const LoginScreen = ({navigation}) => {
  const [channel, setChannel] = useState('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [passUi, setPassUi] = useState({show: false, remember: true});
  const [loading, setLoading] = useState(false);
  const {login} = useAuth();

  const clearError = key => {
    setErrors(prev => (prev[key] ? {...prev, [key]: ''} : prev));
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const normalizedPhone = normalizeBdMobile(phone);
    const nextErrors = {};

    if (channel === 'phone') {
      if (!normalizedPhone) {
        nextErrors.phone = PHONE_ERROR;
      }
    } else if (!trimmedEmail) {
      nextErrors.email = 'Please enter your email';
    }
    if (!password.trim()) {
      nextErrors.password = 'Please enter your password';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const value = channel === 'phone' ? normalizedPhone : trimmedEmail;
    setLoading(true);
    try {
      const response = await loginUser({
        password,
        ...buildAuthIdentifier(channel, value),
      });

      if (response.success) {
        const {token, refreshToken, user} = extractAuthPayload(response);
        if (!token) {
          showError(response.message || 'Login failed', 'Login Failed');
          return;
        }

        if (user?.role && user.role !== 'CAREGIVER') {
          showError(
            'This account is not a caregiver. Please use the family app.',
            'Account Error',
          );
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
      const code = String(response.code || '').toUpperCase();

      if (code === 'ACCOUNT_NOT_VERIFIED') {
        try {
          await resendOtp(buildAuthIdentifier(channel, value));
        } catch (error) {
          // A cooldown (429) must not block the OTP screen.
        }
        navigation?.navigate('VerifyPhone', {channel, value});
        return;
      }

      if (code === 'FORBIDDEN') {
        showError(response.message || 'Account is not active', 'Account');
        return;
      }

      if (code === 'UNAUTHORIZED' || status === 401) {
        showError('Invalid credentials', 'Login Failed');
        return;
      }

      showError(response.message || 'Login failed', 'Login Failed');
    } catch (err) {
      showError('Something went wrong. Please try again.', 'Error');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const subtitle =
    channel === 'phone'
      ? 'Sign in with your phone number'
      : 'Sign in with your email';

  return (
    <AuthShell
      navigation={navigation}
      showBack
      title="Log in"
      subtitle={subtitle}>
      <Loader visible={loading} overlay />

      <AuthChannelToggle
        value={channel}
        onChange={next => {
          setChannel(next);
          setErrors(prev => ({...prev, email: '', phone: ''}));
        }}
      />

      {channel === 'phone' ? (
        <PhoneField
          value={phone}
          onChangeText={text => {
            setPhone(toPhoneFieldValue(text));
            clearError('phone');
          }}
          error={errors.phone}
        />
      ) : (
        <AppInput
          icon="mail-outline"
          value={email}
          onChangeText={text => {
            setEmail(text);
            clearError('email');
          }}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
        />
      )}

      <AppInput
        icon="lock-closed-outline"
        value={password}
        onChangeText={text => {
          setPassword(text);
          clearError('password');
        }}
        placeholder="Password"
        secureTextEntry={!passUi.show}
        autoCapitalize="none"
        rightIcon={passUi.show ? 'eye-outline' : 'eye-off-outline'}
        onRightPress={() => setPassUi(prev => ({...prev, show: !prev.show}))}
        error={errors.password}
      />

      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.remember}
          onPress={() =>
            setPassUi(prev => ({...prev, remember: !prev.remember}))
          }>
          <View
            style={[styles.checkbox, passUi.remember && styles.checkboxActive]}>
            {passUi.remember ? (
              <Icon name="checkmark" size={12} color="#FFFFFF" />
            ) : null}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            showAlert(
              'Forgot password',
              'Please contact support to reset your password.',
            )
          }>
          <Text style={styles.forgot}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <AppButton
        title="Login"
        onPress={handleLogin}
        disabled={loading}
        style={styles.loginButton}
      />

      <View style={authStyles.footer}>
        <Text style={authStyles.footerText}>Don't have an account?</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('Register')}>
          <Text style={authStyles.footerLink}>Register</Text>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  loginButton: {marginTop: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  remember: {flexDirection: 'row', alignItems: 'center', gap: 8},
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#D7E4DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {backgroundColor: AUTH.teal},
  rememberText: {fontSize: 13, fontWeight: '600', color: AUTH.title},
  forgot: {fontSize: 13, fontWeight: '600', color: AUTH.teal},
});
