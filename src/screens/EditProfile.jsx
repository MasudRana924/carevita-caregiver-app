import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import Loader from '../components/common/Loader';
import Header from '../components/common/Header';
import SearchableDropdown from '../components/common/SearchableDropdown';
import AppInput from '../components/common/AppInput';
import AppButton, {AppButtonBar} from '../components/common/AppButton';
import Toast from '../components/common/Toast';
import {bangladeshDistricts} from '../data/bangladeshLocations';
import {getThanasByDistrict} from '../data/bangladeshThanas';
import {requestGalleryPermission} from '../utils/permissions';
import {useAuth} from '../context/AuthContext';
import {useCaregiverProfile} from '../api/queries';
import {useUpdateCaregiverProfile} from '../api/mutations';
import {showError} from '../context/ErrorModalContext';

const TEAL = '#0B8A80';
const PAGE_BG = '#FFFFFF';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = [
  {value: 'Female', label: 'Female'},
  {value: 'Male', label: 'Male'},
  {value: 'Other', label: 'Other'},
];

const normalizeGender = value => {
  const raw = String(value || '').trim().toUpperCase();
  if (raw === 'FEMALE' || raw === 'F') {
    return 'Female';
  }
  if (raw === 'MALE' || raw === 'M') {
    return 'Male';
  }
  if (raw === 'OTHER') {
    return 'Other';
  }
  if (value === 'Female' || value === 'Male' || value === 'Other') {
    return value;
  }
  return '';
};

/** UI text → API multipart string: "Dhaka" | "Dhaka,Mirpur" */
const formatServiceAreasForApi = value =>
  String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .join(',');

const EditProfile = ({navigation}) => {
  const {completeCaregiverProfile, caregiverProfile, user, updateUser} =
    useAuth();
  const {data: profileRes, refetch} = useCaregiverProfile();
  const updateMutation = useUpdateCaregiverProfile();

  const existing = useMemo(
    () => profileRes?.data || caregiverProfile || {},
    [profileRes?.data, caregiverProfile],
  );

  const [photo, setPhoto] = useState(null);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [form, setForm] = useState({
    name: '',
    district: '',
    thana: '',
    bio: '',
    experience_years: '',
    hourly_rate: '',
    education: '',
    blood_group: '',
    date_of_birth: '',
    gender: '',
    service_areas: '',
  });

  useEffect(() => {
    const resolvedName =
      existing.name ||
      existing.full_name ||
      user?.name ||
      '';
    if (!existing?.id && !existing?.district && !resolvedName) {
      return;
    }
    setForm({
      name: resolvedName,
      district: existing.district || '',
      thana: existing.thana || '',
      bio: existing.bio || '',
      experience_years:
        existing.experience_years !== undefined &&
        existing.experience_years !== null
          ? String(existing.experience_years)
          : '',
      hourly_rate:
        existing.hourly_rate !== undefined && existing.hourly_rate !== null
          ? String(existing.hourly_rate)
          : '',
      education: existing.education || '',
      blood_group: existing.blood_group || '',
      date_of_birth: existing.date_of_birth
        ? String(existing.date_of_birth).split('T')[0]
        : '',
      gender: normalizeGender(existing.gender),
      service_areas: Array.isArray(existing.service_areas)
        ? existing.service_areas.join(', ')
        : existing.service_areas || '',
    });
    if (existing.profile_photo) {
      setPhoto({uri: existing.profile_photo, remote: true});
    }
  }, [existing, user?.name]);

  const thanas = useMemo(
    () => getThanasByDistrict(form.district),
    [form.district],
  );

  const updateField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'district' ? {thana: ''} : {}),
    }));
  };

  const showToast = (message, type = 'success') => {
    setToast({visible: true, message, type});
  };

  const openModal = type => {
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
  };

  const handleSelect = value => {
    if (modalType === 'blood_group') {
      updateField('blood_group', value);
    } else if (modalType === 'gender') {
      updateField('gender', value);
    }
    closeModal();
  };

  const handleImagePick = async () => {
    try {
      const granted = await requestGalleryPermission();
      if (!granted) {
        showError(
          'Please allow photo library access to update your profile photo.',
          'Permission required',
        );
        return;
      }
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        showError(result.errorMessage || 'Failed to open image picker');
        return;
      }
      if (result.assets?.[0]?.uri) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      showError('Failed to open image picker');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showError('Please enter your name', 'Required');
      return;
    }
    if (!form.district.trim() || !form.thana.trim()) {
      showError('Please select district and thana', 'Required');
      return;
    }

    // Same shape as backend FormData sample — all text as strings
    const fields = {
      name: form.name.trim(),
      district: form.district.trim(),
      thana: form.thana.trim(),
      bio: form.bio.trim() || '',
      experience_years: String(form.experience_years.trim() ?? ''),
      hourly_rate: String(form.hourly_rate.trim() ?? ''),
      education: form.education.trim() || '',
      blood_group: form.blood_group || '',
      date_of_birth: form.date_of_birth.trim() || '',
      gender: normalizeGender(form.gender) || '',
      // "Dhaka" or "Dhaka,Mirpur"
      service_areas: formatServiceAreasForApi(form.service_areas) || '',
    };

    // Only send a newly picked local photo (not existing remote http URL)
    const imageUri =
      photo?.uri && !photo.remote && !String(photo.uri).startsWith('http')
        ? photo.uri
        : null;

    const photoAsset = imageUri
      ? {
          uri: imageUri,
          type: photo?.type || 'image/jpeg',
          fileName: photo?.fileName || 'profile.jpg',
        }
      : null;

    try {
      const response = await updateMutation.mutateAsync({
        fields,
        photoAsset,
      });
      const saved = response?.data || fields;
      completeCaregiverProfile(saved);
      if (fields.name) {
        await updateUser({...(user || {}), name: fields.name});
      }
      await refetch();
      showToast(response?.message || 'Profile updated successfully');
      navigation?.goBack();
    } catch (error) {
      showError(error?.message || 'Failed to update profile');
    }
  };

  const saving = updateMutation.isPending;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['bottom', 'left', 'right']}>
      <Loader visible={saving} overlay />
      <Header title="Edit Profile" onBack={() => navigation?.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
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
              {photo?.uri ? (
                <Image source={{uri: photo.uri}} style={styles.photo} />
              ) : (
                <Icon name="camera-outline" size={26} color={TEAL} />
              )}
              <View style={styles.pencilBadge}>
                <Icon name="pencil" size={10} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          <AppInput
            label="Name *"
            icon="person-outline"
            value={form.name}
            onChangeText={text => updateField('name', text)}
            placeholder="Enter full name"
            autoCapitalize="words"
          />

          <SearchableDropdown
            label="District *"
            data={bangladeshDistricts}
            value={form.district}
            onSelect={value => updateField('district', value)}
            placeholder="Select district"
            containerStyle={styles.dropdown}
          />

          <SearchableDropdown
            label="Thana *"
            data={thanas}
            value={form.thana}
            onSelect={value => updateField('thana', value)}
            placeholder={
              form.district ? 'Select thana' : 'Select district first'
            }
            containerStyle={styles.dropdown}
          />

          <AppInput
            label="Hourly rate (BDT)"
            icon="cash-outline"
            value={form.hourly_rate}
            onChangeText={text =>
              updateField('hourly_rate', text.replace(/[^0-9.]/g, ''))
            }
            placeholder="e.g. 250"
            keyboardType="numeric"
          />

          <AppInput
            label="Bio"
            icon="document-text-outline"
            value={form.bio}
            onChangeText={text => updateField('bio', text)}
            placeholder="Short introduction about your caregiving experience"
            multiline
          />

          <AppInput
            label="Experience (years)"
            icon="briefcase-outline"
            value={form.experience_years}
            onChangeText={text =>
              updateField('experience_years', text.replace(/[^0-9]/g, ''))
            }
            placeholder="e.g. 5"
            keyboardType="numeric"
          />

          <AppInput
            label="Service areas"
            icon="map-outline"
            value={form.service_areas}
            onChangeText={text => updateField('service_areas', text)}
            placeholder="Dhaka or Dhaka,Mirpur"
          />

          <AppInput
            label="Education"
            icon="school-outline"
            value={form.education}
            onChangeText={text => updateField('education', text)}
            placeholder="e.g. HSC, caregiving certificate"
          />

          <FieldLabel icon="water-outline" label="Blood group" />
          <TouchableOpacity
            style={styles.selectorField}
            onPress={() => openModal('blood_group')}>
            <View style={styles.selectorContent}>
              <Text style={styles.selectorValue}>
                {form.blood_group || 'Select blood group'}
              </Text>
              <Icon name="chevron-down" size={20} color="#8A97A6" />
            </View>
          </TouchableOpacity>

          <AppInput
            label="Date of birth"
            icon="calendar-outline"
            value={form.date_of_birth}
            onChangeText={text => updateField('date_of_birth', text)}
            placeholder="YYYY-MM-DD"
          />

          <FieldLabel icon="male-female-outline" label="Gender" />
          <TouchableOpacity
            style={styles.selectorField}
            onPress={() => openModal('gender')}>
            <View style={styles.selectorContent}>
              <Text style={styles.selectorValue}>
                {form.gender || 'Select gender'}
              </Text>
              <Icon name="chevron-down" size={20} color="#8A97A6" />
            </View>
          </TouchableOpacity>
        </ScrollView>

        <AppButtonBar>
          <AppButton
            title="Save changes"
            onPress={handleSave}
            disabled={saving}
            style={styles.flexBtn}
          />
        </AppButtonBar>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({...prev, visible: false}))}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}>
          <SafeAreaView style={styles.bottomSheetContainer} edges={['bottom']}>
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>
                {modalType === 'blood_group' ? 'Select Blood Group' : 'Select Gender'}
              </Text>
              <ScrollView style={styles.optionsList}>
                {modalType === 'blood_group' &&
                  BLOOD_GROUPS.map(group => (
                    <TouchableOpacity
                      key={group}
                      style={styles.optionItem}
                      onPress={() => handleSelect(group)}>
                      <Text
                        style={[
                          styles.optionText,
                          form.blood_group === group && styles.optionTextActive,
                        ]}>
                        {group}
                      </Text>
                      {form.blood_group === group && (
                        <Icon name="checkmark" size={20} color={TEAL} />
                      )}
                    </TouchableOpacity>
                  ))}
                {modalType === 'gender' &&
                  GENDERS.map(item => (
                    <TouchableOpacity
                      key={item.value}
                      style={styles.optionItem}
                      onPress={() => handleSelect(item.value)}>
                      <Text
                        style={[
                          styles.optionText,
                          form.gender === item.value && styles.optionTextActive,
                        ]}>
                        {item.label}
                      </Text>
                      {form.gender === item.value && (
                        <Icon name="checkmark" size={20} color={TEAL} />
                      )}
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const FieldLabel = ({icon, label}) => (
  <View style={styles.labelRow}>
    <Icon name={icon} size={14} color="#8A97A6" />
    <Text style={styles.label}>{label}</Text>
  </View>
);

export default EditProfile;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: PAGE_BG},
  flex: {flex: 1},
  scrollContent: {paddingHorizontal: 16, paddingBottom: 24},
  photoCard: {
    // backgroundColor: '#E7F6F3',
    // borderRadius: 26,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
    alignSelf: 'center',
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {width: 100, height: 100, borderRadius: 50},
  pencilBadge: {
    position: 'absolute',
    right: -2,
    bottom: -1,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E7F6F3',
  },
  photoCopy: {flex: 1},
  photoTitle: {fontSize: 15, fontWeight: '800', color: '#15202B'},
  photoHint: {marginTop: 3, fontSize: 12, color: '#6F7F8C'},
  dropdown: {marginBottom: 8},
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15202B',
  },
  selectorField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E8F0',
    marginBottom: 8,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  selectorValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#15202B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15202B',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  optionsList: {
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  optionTextActive: {
    color: TEAL,
  },
  flexBtn: {flex: 1},
});
