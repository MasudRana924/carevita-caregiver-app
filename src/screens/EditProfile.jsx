import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
import {useUserProfile} from '../api/queries';
import {useUpdateProfile, useUploadProfilePhoto} from '../api/mutations';
import {launchImageLibrary} from 'react-native-image-picker';
import Toast from '../components/common/Toast';
import Header from '../components/common/Header';
import {requestGalleryPermission} from '../utils/permissions';
import {useAuth} from '../context/AuthContext';

const EditProfile = ({navigation}) => {
  const {data: profileData} = useUserProfile();
  const updateMutation = useUpdateProfile();
  const photoMutation = useUploadProfilePhoto();
  const {updateUser} = useAuth();

  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success',
  });
  const [imageUri, setImageUri] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    language_preference: 'en',
    emergency_contact: '',
    address: '',
  });

  const user = profileData?.data || {};

  React.useEffect(() => {
    if (user.name || user.email) {
      setFormData({
        name: user.name || '',
        language_preference: user.language_preference || 'en',
        emergency_contact: user.emergency_contact || '',
        address: user.address || '',
      });
      if (user.profile_photo) {
        setImageUri(user.profile_photo);
      }
    }
  }, [
    user.name,
    user.email,
    user.language_preference,
    user.emergency_contact,
    user.address,
    user.profile_photo,
  ]);

  const handleImagePick = async () => {
    try {
      const granted = await requestGalleryPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo library access to update your profile picture.',
        );
        return;
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert(
          'Error',
          result.errorMessage || 'Failed to open image picker',
        );
        return;
      }
      if (result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({visible: true, message, type});
  };

  const handleSaveProfile = async () => {
    const {name, language_preference, emergency_contact, address} = formData;

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter name');
      return;
    }

    try {
      const response = await updateMutation.mutateAsync({
        name: name.trim(),
        language_preference,
        emergency_contact: emergency_contact.trim(),
        address: address.trim(),
      });

      if (imageUri && !String(imageUri).startsWith('http')) {
        const photoData = new FormData();
        photoData.append('photo', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        });
        const photoRes = await photoMutation.mutateAsync(photoData);
        if (photoRes?.profile_photo || photoRes?.data?.profile_photo) {
          await updateUser({
            ...(response?.user || response?.data || {}),
            profile_photo: photoRes.profile_photo || photoRes.data.profile_photo,
          });
        }
      } else {
        await updateUser(response?.user || response?.data || {name});
      }

      showToast('Profile updated successfully');
      navigation?.goBack();
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast(error?.message || 'Failed to update profile', 'error');
    }
  };

  const saving = updateMutation.isPending || photoMutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={saving} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <Header title="Edit profile" onBack={() => navigation?.goBack()} />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.photoWrap}
            onPress={handleImagePick}>
            {imageUri ? (
              <Image source={{uri: imageUri}} style={styles.photo} />
            ) : (
              <View style={styles.photoEmpty}>
                <Icon name="camera-outline" size={28} color="#008178" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Icon name="pencil" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to change photo</Text>

          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={text => setFormData({...formData, name: text})}
            placeholder="Enter name"
            placeholderTextColor="#8190A7"
          />

          <Text style={styles.label}>Language</Text>
          <View style={styles.langRow}>
            {[
              {key: 'en', label: 'English'},
              {key: 'bn', label: 'বাংলা'},
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.langChip,
                  formData.language_preference === option.key &&
                    styles.langChipActive,
                ]}
                onPress={() =>
                  setFormData({...formData, language_preference: option.key})
                }>
                <Text
                  style={[
                    styles.langText,
                    formData.language_preference === option.key &&
                      styles.langTextActive,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Emergency contact</Text>
          <TextInput
            style={styles.input}
            value={formData.emergency_contact}
            onChangeText={text =>
              setFormData({...formData, emergency_contact: text})
            }
            placeholder="01XXXXXXXXX"
            placeholderTextColor="#8190A7"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={text => setFormData({...formData, address: text})}
            placeholder="Enter address"
            placeholderTextColor="#8190A7"
          />
        </ScrollView>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.submitButton}
            onPress={handleSaveProfile}
            disabled={saving}>
            <Text style={styles.submitButtonText}>Save changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({...toast, visible: false})}
      />
    </SafeAreaView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  flex: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingBottom: 24},
  photoWrap: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  photo: {width: 96, height: 96, borderRadius: 48},
  photoEmpty: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoHint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#8190A7',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111820',
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111820',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    marginBottom: 16,
  },
  langRow: {flexDirection: 'row', gap: 10, marginBottom: 16},
  langChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E3E8F0',
  },
  langChipActive: {backgroundColor: '#E6F4F3', borderColor: '#008178'},
  langText: {fontSize: 14, fontWeight: '600', color: '#8190A7'},
  langTextActive: {color: '#008178'},
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    height: 52,
    backgroundColor: '#008178',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {fontSize: 16, fontWeight: '600', color: '#FFFFFF'},
});
