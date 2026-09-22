import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {showAlert} from '../context/AlertModalContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import AuthShell, {AUTH, authStyles} from '../components/auth/AuthShell';
import {loginUser, extractAuthPayload} from '../services/api';
import {useAuth} from '../context/AuthContext';
import notificationService from '../services/notificationService';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passUi, setPassUi] = useState({show: false, remember: true});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const {login} = useAuth();

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Starting login process...');
      const response = await loginUser(email.trim(), password);

      const {token, refreshToken, user} = extractAuthPayload(response);
      if (response.success && token) {
        console.log('✅ Login API response received');

        if (user?.role && user.role !== 'CAREGIVER') {
          setError(
            'This account is not a caregiver. Please use the family app.',
          );
          return;
        }

        const loggedIn = await login(token, refreshToken, user);
        if (!loggedIn) {
          return;
        }
        console.log('✅ Auth tokens stored locally');
        await notificationService.registerAfterAuth(token);
      } else {
        const message = response.message || 'Login failed';
        const needsVerify =
          response.code === 'UNVERIFIED' ||
          response.errors?.some?.(e =>
            String(e?.message || e)
              .toLowerCase()
              .includes('verify'),
          ) ||
          message.toLowerCase().includes('verify');
        if (needsVerify) {
          navigation?.navigate('VerifyPhone', {email: email.trim()});
        }
        setError(message);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('❌ Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      navigation={navigation}
      title="Welcome back"
      subtitle="Sign in to manage bookings and your caregiver profile.">
      <Loader visible={loading} overlay />

      <AppInput
        label="Email Address"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <AppInput
        label="Password"
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry={!passUi.show}
        autoCapitalize="none"
        rightIcon={passUi.show ? 'eye-outline' : 'eye-off-outline'}
        onRightPress={() =>
          setPassUi(prev => ({...prev, show: !prev.show}))
        }
      />

      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.remember}
          onPress={() =>
            setPassUi(prev => ({...prev, remember: !prev.remember}))
          }>
          <View
            style={[
              styles.checkbox,
              passUi.remember && styles.checkboxActive,
            ]}>
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

      {error ? <Text style={authStyles.errorText}>{error}</Text> : null}

      <AppButton
        title="Login"
        onPress={handleLogin}
        disabled={loading}
        style={{marginTop: 8}}
      />

      <View style={authStyles.footer}>
        <Text style={authStyles.footerText}>Don't have an account?</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('Register')}>
          <Text style={authStyles.footerLink}>Register </Text>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
};

export default LoginScreen;

const styles = {
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
};
