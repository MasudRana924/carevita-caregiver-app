import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import {useChangePassword} from '../api/mutations';
import {showError} from '../context/ErrorModalContext';

const ChangePasswordScreen = ({navigation}) => {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSave = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      showError('Enter current and new password', 'Required');
      return;
    }
    if (newPassword.trim().length < 6) {
      showError('New password must be at least 6 characters');
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      Alert.alert('Updated', 'Password changed successfully', [
        {text: 'OK', onPress: () => navigation?.goBack()},
      ]);
    } catch (error) {
      showError(error?.message || 'Failed to change password');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={changePassword.isPending} overlay />
      <Header title="Change password" onBack={() => navigation?.goBack()} />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AppInput
          label="Current password"
          icon="lock-closed-outline"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current password"
          secureTextEntry={!showCurrent}
          autoCapitalize="none"
          rightIcon={showCurrent ? 'eye-outline' : 'eye-off-outline'}
          onRightPress={() => setShowCurrent(prev => !prev)}
        />

        <AppInput
          label="New password"
          icon="lock-closed-outline"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
          secureTextEntry={!showNew}
          autoCapitalize="none"
          rightIcon={showNew ? 'eye-outline' : 'eye-off-outline'}
          onRightPress={() => setShowNew(prev => !prev)}
        />

        <AppButton
          title="Update password"
          onPress={handleSave}
          disabled={changePassword.isPending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  content: {flex: 1, paddingHorizontal: 20},
});
