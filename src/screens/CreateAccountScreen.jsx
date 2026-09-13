import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <Loader visible={loading} />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backButton}
              onPress={() => navigation?.goBack()}>
              <Icon name="arrow-back" size={22} color="#111820" />
            </TouchableOpacity>
            <Image source={require('../assets/auth.png')} style={styles.authImage} />
          </View>

          <Text style={styles.title}>Join as a caregiver</Text>
          <Text style={styles.subtitle}>
            Register to receive bookings and earn from your care work
          </Text>

          <Text style={styles.label}>Full name</Text>
          <View style={styles.inputContainer}>
            <Icon name="person-outline" size={20} color="#8190A7" />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#8190A7"
              value={form.name}
              onChangeText={text => updateField('name', text)}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Icon name="mail-outline" size={20} color="#8190A7" />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#8190A7"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={text => updateField('email', text)}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={20} color="#8190A7" />
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor="#8190A7"
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
                size={20}
                color="#8190A7"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.termsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAgreed(prev => !prev)}
              style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && (
                <Icon name="checkmark" size={14} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I agree to Nirapod's{' '}
              <Text style={styles.link}>Terms</Text>
              {' '}and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryButton}
            disabled={loading}
            onPress={handleRegister}>
            <Text style={styles.primaryButtonText}>Create account</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation?.navigate('Login')}>
              <Text style={styles.footerLink}> Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateAccountScreen;

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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#E3E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: '#008178',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#8190A7',
  },
  link: {
    color: '#008178',
    fontWeight: '600',
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
});
