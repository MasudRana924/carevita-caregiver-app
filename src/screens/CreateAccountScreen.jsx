import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import AuthShell, {AUTH, authStyles} from '../components/auth/AuthShell';
import {
  AuthChannelToggle,
  PhoneField,
} from '../components/auth/AuthMethodFields';
import {registerUser} from '../services/api';
import {showError} from '../context/ErrorModalContext';
import {showAlert} from '../context/AlertModalContext';
import {
  PHONE_ERROR,
  isValidEmail,
  normalizeBdMobile,
  toPhoneFieldValue,
} from '../utils/authContact';

const CreateAccountScreen = ({navigation}) => {
  const [channel, setChannel] = useState('phone');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });

  const updateField = (field, value) => {
    setForm(prev => ({...prev, [field]: value}));
    setErrors(prev => (prev[field] ? {...prev, [field]: ''} : prev));
  };

  const handleRegister = async () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = normalizeBdMobile(form.phone);
    const nextErrors = {};

    if (!name) {
      nextErrors.name = 'Please enter your full name';
    }
    if (channel === 'phone') {
      if (!phone) {
        nextErrors.phone = PHONE_ERROR;
      }
    } else if (!email) {
      nextErrors.email = 'Please enter your email';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (!form.password) {
      nextErrors.password = 'Please enter a password';
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }
    if (form.password !== form.confirm) {
      nextErrors.confirm = 'Passwords do not match';
    }
    if (!agreed) {
      nextErrors.policy = 'Please accept the Privacy and Policy';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser(
        channel === 'phone'
          ? {name, phone, password: form.password}
          : {name, email, password: form.password},
      );

      if (response.success) {
        const data = response.data || {};
        const resolvedChannel =
          data.otp_channel === 'email' || data.otp_channel === 'phone'
            ? data.otp_channel
            : channel;
        const value =
          resolvedChannel === 'phone'
            ? data.user?.phone || phone
            : data.user?.email || email;
        navigation?.navigate('VerifyPhone', {channel: resolvedChannel, value});
        return;
      }

      const status = response.status || response.statusCode;
      const code = String(response.code || '').toUpperCase();
      if (status === 409 || code === 'CONFLICT') {
        showAlert(
          'Already registered',
          response.message || 'An account with these details already exists.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Log in instead',
              onPress: () => navigation?.navigate('Login'),
            },
          ],
        );
        return;
      }

      showError(response.message || 'Registration failed');
    } catch (error) {
      showError('Something went wrong. Please try again.');
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subtitle =
    channel === 'phone'
      ? 'Register with your phone number'
      : 'Register with your email';

  return (
    <AuthShell
      navigation={navigation}
      showBack
      title="Create Account"
      subtitle={subtitle}>
      <Loader visible={loading} overlay />

      <AuthChannelToggle
        value={channel}
        onChange={next => {
          setChannel(next);
          setErrors(prev => ({...prev, email: '', phone: ''}));
        }}
      />

      <AppInput
        icon="person-outline"
        value={form.name}
        onChangeText={text => updateField('name', text)}
        placeholder="Full name"
        autoCapitalize="words"
        error={errors.name}
      />

      {channel === 'phone' ? (
        <PhoneField
          value={form.phone}
          onChangeText={text => updateField('phone', toPhoneFieldValue(text))}
          error={errors.phone}
        />
      ) : (
        <AppInput
          icon="mail-outline"
          value={form.email}
          onChangeText={text => updateField('email', text)}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
        />
      )}

      <AppInput
        icon="lock-closed-outline"
        value={form.password}
        onChangeText={text => updateField('password', text)}
        placeholder="Password"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
        onRightPress={() => setShowPassword(prev => !prev)}
        error={errors.password}
      />

      <AppInput
        icon="lock-closed-outline"
        value={form.confirm}
        onChangeText={text => updateField('confirm', text)}
        placeholder="Confirm password"
        secureTextEntry={!showConfirm}
        autoCapitalize="none"
        rightIcon={showConfirm ? 'eye-outline' : 'eye-off-outline'}
        onRightPress={() => setShowConfirm(prev => !prev)}
        error={errors.confirm}
      />

      <View style={styles.termsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setAgreed(prev => !prev);
            setErrors(prev => ({...prev, policy: ''}));
          }}
          hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}>
          <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
            {agreed ? (
              <Icon name="checkmark" size={12} color="#FFFFFF" />
            ) : null}
          </View>
        </TouchableOpacity>
        <Text style={styles.termsText}>
          I accept all{' '}
          <Text
            style={styles.link}
            onPress={() =>
              navigation?.navigate('PrivacyPolicy', {role: 'CAREGIVER'})
            }>
            Privacy and Policy
          </Text>
        </Text>
      </View>
      {errors.policy ? (
        <Text style={styles.policyError}>{errors.policy}</Text>
      ) : null}

      <AppButton
        title="Create account"
        onPress={handleRegister}
        disabled={loading}
      />

      <View style={authStyles.footer}>
        <Text style={authStyles.footerText}>Already have an account?</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('Login')}>
          <Text style={authStyles.footerLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
};

export default CreateAccountScreen;

const styles = StyleSheet.create({
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#D7E4DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: {backgroundColor: AUTH.teal},
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: AUTH.muted,
  },
  link: {color: AUTH.button, fontWeight: '700'},
  policyError: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 28,
    marginBottom: 12,
  },
});
