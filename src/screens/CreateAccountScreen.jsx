import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
import AuthShell, {AUTH, authStyles} from '../components/auth/AuthShell';
import {registerUser} from '../services/api';

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
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (!agreed) {
      Alert.alert('Error', 'Please agree to the Terms of Service');
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser(name.trim(), email.trim(), password);
      if (response.success) {
        navigation?.navigate('VerifyPhone', {email: email.trim()});
      } else {
        Alert.alert('Error', response.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      navigation={navigation}
      showBack
      title={'Create\naccount'}
      subtitle="Register to receive bookings and earn from your care work.">
      <Loader visible={loading} />

      <Text style={authStyles.label}>Full Name</Text>
      <View style={authStyles.inputRow}>
        <Icon name="person-outline" size={18} color="#8A97A6" />
        <TextInput
          style={authStyles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#B0BAC4"
          value={form.name}
          onChangeText={text => updateField('name', text)}
          autoCapitalize="words"
        />
      </View>

      <Text style={authStyles.label}>Email Address</Text>
      <View style={authStyles.inputRow}>
        <Icon name="mail-outline" size={18} color="#8A97A6" />
        <TextInput
          style={authStyles.input}
          placeholder="Enter your email"
          placeholderTextColor="#B0BAC4"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={text => updateField('email', text)}
        />
      </View>

      <Text style={authStyles.label}>Password</Text>
      <View style={authStyles.inputRow}>
        <Icon name="lock-closed-outline" size={18} color="#8A97A6" />
        <TextInput
          style={authStyles.input}
          placeholder="Create a password"
          placeholderTextColor="#B0BAC4"
          secureTextEntry={!showPassword}
          value={form.password}
          onChangeText={text => updateField('password', text)}
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowPassword(prev => !prev)}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Icon
            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
            size={18}
            color="#8A97A6"
          />
        </TouchableOpacity>
      </View>

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

      <TouchableOpacity
        activeOpacity={0.85}
        style={authStyles.primaryButton}
        disabled={loading}
        onPress={handleRegister}>
        <Icon name="arrow-forward" size={18} color="#FFFFFF" />
        <Text style={authStyles.primaryButtonText}>Register</Text>
      </TouchableOpacity>

      <View style={authStyles.footer}>
        <Text style={authStyles.footerText}>Already have an account?</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('Login')}>
          <Text style={authStyles.footerLink}>Login  →</Text>
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
