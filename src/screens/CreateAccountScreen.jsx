import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import AuthShell, {AUTH, authStyles} from '../components/auth/AuthShell';
import {registerUser, extractAuthPayload} from '../services/api';
import notificationService from '../services/notificationService';
import {showError} from '../context/ErrorModalContext';

const CreateAccountScreen = ({navigation}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const updateField = (field, value) => {
    setForm(prev => ({...prev, [field]: value}));
  };

  const handleRegister = async () => {
    const {name, email, password} = form;

    if (!name.trim()) {
      showError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      showError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      showError('Please enter a password');
      return;
    }
    if (!agreed) {
      showError('Please agree to the Terms of Service');
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser(name.trim(), email.trim(), password);
      if (response.success) {
        const {token} = extractAuthPayload(response);
        await notificationService.registerAfterAuth(token);
        navigation?.navigate('VerifyPhone', {email: email.trim()});
      } else {
        showError(response.message || 'Registration failed');
      }
    } catch (error) {
      showError('Something went wrong. Please try again.');
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      navigation={navigation}
      showBack
      title="Create account"
      subtitle="Register to receive bookings and earn from your care work.">
      <Loader visible={loading} overlay />

      <AppInput
        label="Full Name"
        icon="person-outline"
        value={form.name}
        onChangeText={text => updateField('name', text)}
        placeholder="Enter your full name"
        autoCapitalize="words"
      />

      <AppInput
        label="Email Address"
        icon="mail-outline"
        value={form.email}
        onChangeText={text => updateField('email', text)}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <AppInput
        label="Password"
        icon="lock-closed-outline"
        value={form.password}
        onChangeText={text => updateField('password', text)}
        placeholder="Create a password"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
        onRightPress={() => setShowPassword(prev => !prev)}
      />

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setAgreed(prev => !prev)}
        style={styles.termsRow}>
        <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
          {agreed ? <Icon name="checkmark" size={12} color="#FFFFFF" /> : null}
        </View>
        <Text style={styles.termsText}>
          I agree to Nirapod's <Text style={styles.link}>Terms</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>

      <AppButton title="Register" onPress={handleRegister} disabled={loading} />

      <View style={authStyles.footer}>
        <Text style={authStyles.footerText}>Already have an account?</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('Login')}>
          <Text style={authStyles.footerLink}>Login </Text>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
};

export default CreateAccountScreen;

const styles = {
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
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
  link: {color: AUTH.teal, fontWeight: '700'},
};
