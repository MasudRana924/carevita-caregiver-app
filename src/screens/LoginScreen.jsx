import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
import {loginUser, extractAuthPayload} from '../services/api';
import {useAuth} from '../context/AuthContext';
import notificationService from '../services/notificationService';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

        // Step 2: Initialize notification service
        console.log('🔔 Initializing notification service...');
        const notificationInitialized = await notificationService.initialize(
          token,
        );

        if (notificationInitialized) {
          console.log('✅ Notification service initialized');
        } else {
          console.log('⚠️ Notification service initialization failed, but continuing...');
        }

        // Step 3: Register FCM token with server
        console.log('📱 Registering FCM token with server...');
        const tokenRegistered = await notificationService.registerTokenWithServer(
          token,
        );

        if (tokenRegistered) {
          console.log('✅ FCM token registered successfully');
        } else {
          console.log('⚠️ FCM token registration failed, but login successful');
        }
      } else {
        const message = response.message || 'Login failed';
        const needsVerify =
          response.errors?.some?.(e =>
            String(e?.message || e)
              .toLowerCase()
              .includes('verify'),
          ) || message.toLowerCase().includes('verify');
        if (needsVerify) {
          navigation?.navigate('VerifyPhone', {email: email.trim()});
        }
        setError(message);
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
      console.error('❌ Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <Loader visible={loading} />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <Image source={require('../assets/auth.png')} style={styles.authImage} />

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to manage bookings and your caregiver profile
          </Text>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Icon name="mail-outline" size={20} color="#8190A7" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#8190A7"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={20} color="#8190A7" />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#8190A7"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Icon
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#8190A7"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryButton}
            disabled={loading}
            onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation?.navigate('Register')}>
              <Text style={styles.footerLink}> Register</Text>
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  authImage: {
    width: 40,
    height: 40,
    marginTop: 10,
    marginBottom: 24,
    alignSelf: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111820',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    fontSize: 15,
    lineHeight: 22,
    color: '#8190A7',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111820',
    marginBottom: 8,
  },
  inputContainer: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#111820',
    paddingVertical: 0,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008178',
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 15,
    color: '#8190A7',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#008178',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 12,
  },
});
