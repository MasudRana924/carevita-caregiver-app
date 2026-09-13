import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import {useChangePassword} from '../api/mutations';

const ChangePasswordScreen = ({navigation}) => {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSave = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      Alert.alert('Required', 'Enter current and new password');
      return;
    }
    if (newPassword.trim().length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
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
      Alert.alert('Error', error?.message || 'Failed to change password');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={changePassword.isPending} />
      <Header title="Change password" onBack={() => navigation?.goBack()} />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.label}>Current password</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
            placeholder="Current password"
            placeholderTextColor="#8190A7"
          />
          <TouchableOpacity onPress={() => setShowCurrent(prev => !prev)}>
            <Icon
              name={showCurrent ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#8190A7"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>New password</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            placeholder="New password"
            placeholderTextColor="#8190A7"
          />
          <TouchableOpacity onPress={() => setShowNew(prev => !prev)}>
            <Icon
              name={showNew ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#8190A7"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={changePassword.isPending}>
          <Text style={styles.buttonText}>Update password</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  content: {flex: 1, paddingHorizontal: 20},
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111820',
    marginBottom: 8,
    marginTop: 8,
  },
  inputRow: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {flex: 1, fontSize: 15, color: '#111820', paddingVertical: 0},
  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {fontSize: 16, fontWeight: '600', color: '#FFFFFF'},
});
