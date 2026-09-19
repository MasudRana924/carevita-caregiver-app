import React, {useEffect, useMemo, useState} from 'react';
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
import {launchImageLibrary} from 'react-native-image-picker';
import Loader from '../components/common/Loader';
import Header from '../components/common/Header';
import SearchableDropdown from '../components/common/SearchableDropdown';
import Toast from '../components/common/Toast';
import {bangladeshDistricts} from '../data/bangladeshLocations';
import {getThanasByDistrict} from '../data/bangladeshThanas';
import {requestGalleryPermission} from '../utils/permissions';
import {useAuth} from '../context/AuthContext';
import {useCaregiverProfile} from '../api/queries';
import {useUpdateCaregiverProfile} from '../api/mutations';

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
    is_available: true,
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
      is_available: existing.is_available !== false,
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

  const handleImagePick = async () => {
    try {
      const granted = await requestGalleryPermission();
      if (!granted) {
        Alert.alert(
          'Permission required',
          'Please allow photo library access to update your profile photo.',
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
        Alert.alert(
          'Error',
          result.errorMessage || 'Failed to open image picker',
        );
        return;
      }
      if (result.assets?.[0]?.uri) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (!form.district.trim() || !form.thana.trim()) {
      Alert.alert('Required', 'Please select district and thana');
      return;
    }

    // All values go as strings in multipart/form-data (Content-Type set by fetch)
    const fields = {
      name: form.name.trim(),
      district: form.district.trim(),
      thana: form.thana.trim(),
      bio: form.bio.trim(),
      experience_years: String(form.experience_years.trim()),
      hourly_rate: String(form.hourly_rate.trim()),
      education: form.education.trim(),
      blood_group: form.blood_group,
      date_of_birth: form.date_of_birth.trim(),
      gender: normalizeGender(form.gender),
      // API expects: "Dhaka" or "Dhaka,Mirpur" (not JSON array)
      service_areas: formatServiceAreasForApi(form.service_areas),
      is_available: form.is_available === true,
    };

    const photoAsset =
      photo?.uri && !photo.remote && !String(photo.uri).startsWith('http')
        ? photo
        : null;

    try {
      const response = await updateMutation.mutateAsync({fields, photoAsset});
      const saved = response?.data || fields;
      completeCaregiverProfile(saved);
      if (fields.name) {
        await updateUser({...(user || {}), name: fields.name});
      }
      await refetch();
      showToast(response?.message || 'Profile updated successfully');
      navigation?.goBack();
    } catch (error) {
      showToast(error?.message || 'Failed to update profile', 'error');
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
            <View style={styles.photoCopy}>
              <Text style={styles.photoTitle}>Profile Photo</Text>
              <Text style={styles.photoHint}>Tap to change your photo</Text>
            </View>
          </TouchableOpacity>

          <FieldLabel icon="person-outline" label="Name *" />
          <View style={styles.inputRow}>
            <Icon name="person-outline" size={18} color="#8A97A6" />
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={text => updateField('name', text)}
              placeholder="Enter full name"
              placeholderTextColor="#B0BAC4"
              autoCapitalize="words"
            />
          </View>

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

          <FieldLabel icon="cash-outline" label="Hourly rate (BDT)" />
          <View style={styles.inputRow}>
            <Icon name="cash-outline" size={18} color="#8A97A6" />
            <TextInput
              style={styles.input}
              value={form.hourly_rate}
              onChangeText={text =>
                updateField('hourly_rate', text.replace(/[^0-9.]/g, ''))
              }
              placeholder="e.g. 250"
              placeholderTextColor="#B0BAC4"
              keyboardType="numeric"
            />
          </View>

          <FieldLabel icon="document-text-outline" label="Bio" />
          <TextInput
            style={[styles.inputBox, styles.multiline]}
            value={form.bio}
            onChangeText={text => updateField('bio', text)}
            placeholder="Short introduction about your caregiving experience"
            placeholderTextColor="#B0BAC4"
            multiline
          />

          <FieldLabel icon="briefcase-outline" label="Experience (years)" />
          <View style={styles.inputRow}>
            <Icon name="briefcase-outline" size={18} color="#8A97A6" />
            <TextInput
              style={styles.input}
              value={form.experience_years}
              onChangeText={text =>
                updateField('experience_years', text.replace(/[^0-9]/g, ''))
              }
              placeholder="e.g. 5"
              placeholderTextColor="#B0BAC4"
              keyboardType="numeric"
            />
          </View>

          <FieldLabel icon="map-outline" label="Service areas" />
          <View style={styles.inputRow}>
            <Icon name="map-outline" size={18} color="#8A97A6" />
            <TextInput
              style={styles.input}
              value={form.service_areas}
              onChangeText={text => updateField('service_areas', text)}
              placeholder="Dhaka or Dhaka,Mirpur"
              placeholderTextColor="#B0BAC4"
            />
          </View>

          <FieldLabel icon="school-outline" label="Education" />
          <View style={styles.inputRow}>
            <Icon name="school-outline" size={18} color="#8A97A6" />
            <TextInput
              style={styles.input}
              value={form.education}
              onChangeText={text => updateField('education', text)}
              placeholder="e.g. HSC, caregiving certificate"
              placeholderTextColor="#B0BAC4"
            />
          </View>

          <FieldLabel icon="water-outline" label="Blood group" />
          <View style={styles.chipRow}>
            {BLOOD_GROUPS.map(group => (
              <TouchableOpacity
                key={group}
                style={[
                  styles.chip,
                  form.blood_group === group && styles.chipActive,
                ]}
                onPress={() => updateField('blood_group', group)}>
                <Text
                  style={[
                    styles.chipText,
                    form.blood_group === group && styles.chipTextActive,
                  ]}>
                  {group}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FieldLabel icon="calendar-outline" label="Date of birth" />
          <View style={styles.inputRow}>
            <Icon name="calendar-outline" size={18} color="#8A97A6" />
            <TextInput
              style={styles.input}
              value={form.date_of_birth}
              onChangeText={text => updateField('date_of_birth', text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#B0BAC4"
            />
          </View>

          <FieldLabel icon="male-female-outline" label="Gender" />
          <View style={styles.chipRow}>
            {GENDERS.map(item => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.chip,
                  form.gender === item.value && styles.chipActive,
                ]}
                onPress={() => updateField('gender', item.value)}>
                <Text
                  style={[
                    styles.chipText,
                    form.gender === item.value && styles.chipTextActive,
                  ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.availRow}
            activeOpacity={0.85}
            onPress={() => updateField('is_available', !form.is_available)}>
            <View style={styles.availCopy}>
              <Text style={styles.availTitle}>Available for bookings</Text>
              <Text style={styles.availSub}>
                {form.is_available
                  ? 'Families can assign new bookings to you'
                  : 'You will not receive new booking requests'}
              </Text>
            </View>
            <View
              style={[styles.toggle, form.is_available && styles.toggleOn]}>
              <View
                style={[
                  styles.toggleKnob,
                  form.is_available && styles.toggleKnobOn,
                ]}
              />
            </View>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.bottom}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}>
            <Text style={styles.saveText}>Save changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({...prev, visible: false}))}
      />
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
  scrollContent: {paddingHorizontal: 16, paddingBottom: 24},
  photoCard: {
    backgroundColor: '#E7F6F3',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
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
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#15202B',
    paddingVertical: 0,
  },
  inputBox: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#15202B',
    marginBottom: 14,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8F0',
  },
  chipActive: {
    backgroundColor: '#E7F6F3',
    borderColor: TEAL,
  },
  chipText: {fontSize: 13, fontWeight: '600', color: '#8A97A6'},
  chipTextActive: {color: TEAL},
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E3E8F0',
  },
  availCopy: {flex: 1, paddingRight: 12},
  availTitle: {fontSize: 15, fontWeight: '700', color: '#15202B'},
  availSub: {fontSize: 12, color: '#8A97A6', marginTop: 4, lineHeight: 17},
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {backgroundColor: TEAL},
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobOn: {alignSelf: 'flex-end'},
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
