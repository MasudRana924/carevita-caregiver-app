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
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
import {useUserProfile} from '../api/queries';
import {useUpdateProfile, useUploadProfilePhoto} from '../api/mutations';
import {launchImageLibrary} from 'react-native-image-picker';
import Toast from '../components/common/Toast';
import {requestGalleryPermission} from '../utils/permissions';
import {useAuth} from '../context/AuthContext';

const TEAL = '#0B8A80';
const PAGE_BG = '#F4F8F7';

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
  const [langOpen, setLangOpen] = useState(false);

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
            profile_photo:
              photoRes.profile_photo || photoRes.data.profile_photo,
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
  const lang = formData.language_preference === 'bn' ? 'bn' : 'en';

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}>
      <Loader visible={saving} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack()}>
            <Icon name="arrow-back" size={22} color="#15202B" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Edit Profile</Text>

          </View>

        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.photoCard}
            onPress={handleImagePick}>
            <View style={styles.photoCircle}>
              {imageUri ? (
                <Image source={{uri: imageUri}} style={styles.photo} />
              ) : (
                <Icon name="camera-outline" size={26} color={TEAL} />
              )}
              <View style={styles.pencilBadge}>
                <Icon name="pencil" size={10} color="#FFFFFF" />
              </View>
            </View>
            <View>
              <Text style={styles.photoTitle}>Profile Photo</Text>
              <Text style={styles.photoHint}>Tap to change your photo</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.labelRow}>
            <Icon name="person-outline" size={14} color="#8A97A6" />
            <Text style={styles.label}>Name *</Text>
          </View>
          <View style={styles.inputRow}>
            <Icon name="person-outline" size={18} color="#8A97A6" />
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={text => setFormData({...formData, name: text})}
              placeholder="Enter name"
              placeholderTextColor="#B0BAC4"
            />
          </View>

          <View style={styles.labelRow}>
            <Icon name="call-outline" size={14} color="#8A97A6" />
            <Text style={styles.label}>Emergency contact</Text>
          </View>
          <View style={styles.inputRow}>
            <Icon name="call-outline" size={18} color="#8A97A6" />
            <TextInput
              style={styles.input}
              value={formData.emergency_contact}
              onChangeText={text =>
                setFormData({...formData, emergency_contact: text})
              }
              placeholder="01XXXXXXXXX"
              placeholderTextColor="#B0BAC4"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.labelRow}>
            <Icon name="location-outline" size={14} color="#8A97A6" />
            <Text style={styles.label}>Address</Text>
          </View>
          <View style={styles.inputRow}>
            <Icon name="home-outline" size={18} color="#8A97A6" />
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={text => setFormData({...formData, address: text})}
              placeholder="Enter address"
              placeholderTextColor="#B0BAC4"
            />
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.saveBtn}
            onPress={handleSaveProfile}
            disabled={saving}>
            <Text style={styles.saveText}>Save changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={langOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLangOpen(false)}>
        <SafeAreaView style={styles.langModalRoot} edges={['top', 'right']}>
          <Pressable
            style={styles.langBackdrop}
            onPress={() => setLangOpen(false)}
          />
          <View style={styles.langMenu}>
            <TouchableOpacity
              style={[styles.langOption, lang === 'en' && styles.langOptionActive]}
              onPress={() => {
                setFormData({...formData, language_preference: 'en'});
                setLangOpen(false);
              }}>
              <Text
                style={[
                  styles.langOptionText,
                  lang === 'en' && styles.langOptionTextActive,
                ]}>
                English
              </Text>
              {lang === 'en' ? (
                <Icon name="checkmark" size={16} color={TEAL} />
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langOption, lang === 'bn' && styles.langOptionActive]}
              onPress={() => {
                setFormData({...formData, language_preference: 'bn'});
                setLangOpen(false);
              }}>
              <Text
                style={[
                  styles.langOptionText,
                  lang === 'bn' && styles.langOptionTextActive,
                ]}>
                বাংলা
              </Text>
              {lang === 'bn' ? (
                <Icon name="checkmark" size={16} color={TEAL} />
              ) : null}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

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
  safeArea: {flex: 1, backgroundColor: PAGE_BG},
  flex: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerCopy: {flex: 1},
  headerTitle: {fontSize: 15, fontWeight: '800', color: '#15202B'},
  headerSub: {marginTop: 2, fontSize: 12, color: '#8A97A6'},
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 10,
    height: 32,
    gap: 4,
  },
  langBadgeText: {fontSize: 12, fontWeight: '700', color: TEAL},
  langModalRoot: {flex: 1},
  langBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  langMenu: {
    position: 'absolute',
    top: 58,
    right: 16,
    width: 148,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 6,
    elevation: 8,
    shadowColor: '#15202B',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
  },
  langOption: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langOptionActive: {backgroundColor: '#E7F6F3'},
  langOptionText: {fontSize: 13, fontWeight: '700', color: '#5B6773'},
  langOptionTextActive: {color: TEAL},
  scrollContent: {paddingHorizontal: 16, paddingBottom: 24},
  photoCard: {
    backgroundColor: '#E7F6F3',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  photoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {width: 64, height: 64, borderRadius: 32},
  pencilBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E7F6F3',
  },
  photoTitle: {fontSize: 15, fontWeight: '800', color: '#15202B'},
  photoHint: {marginTop: 3, fontSize: 12, color: '#6F7F8C'},
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15202B',
  },
  inputRow: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#15202B',
    paddingVertical: 0,
  },
  bottom: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
});
