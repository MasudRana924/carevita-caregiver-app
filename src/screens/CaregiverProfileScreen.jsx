import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import SearchableDropdown from '../components/common/SearchableDropdown';
import AppInput from '../components/common/AppInput';
import AppButton, {AppButtonBar} from '../components/common/AppButton';
import {bangladeshDistricts} from '../data/bangladeshLocations';
import {getThanasByDistrict} from '../data/bangladeshThanas';
import {requestGalleryPermission} from '../utils/permissions';
import {useAuth} from '../context/AuthContext';
import {useCaregiverProfile} from '../api/queries';
import {
  useCreateCaregiverProfile,
  useUpdateCaregiverProfile,
} from '../api/mutations';
import {showError} from '../context/ErrorModalContext';

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

const formatServiceAreasForApi = value =>
  String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .join(',');

const CaregiverProfileScreen = ({navigation, route}) => {
  const isSetup = route?.params?.mode === 'setup';
  const {completeCaregiverProfile, caregiverProfile} = useAuth();
  const {data: profileRes} = useCaregiverProfile({enabled: !isSetup});
  const createMutation = useCreateCaregiverProfile();
  const updateMutation = useUpdateCaregiverProfile();

  const existing = useMemo(
    () => profileRes?.data || caregiverProfile || {},
    [profileRes?.data, caregiverProfile],
  );

  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState({
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
    if (!existing?.id && !existing?.district) {
      return;
    }
    setForm({
      district: existing.district || '',
      thana: existing.thana || '',
      bio: existing.bio || '',
      experience_years:
        existing.experience_years !== undefined &&
        existing.experience_years !== null
          ? String(existing.experience_years)
          : '',
      hourly_rate: existing.hourly_rate ? String(existing.hourly_rate) : '',
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
  }, [existing]);

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

  const handleImagePick = async () => {
    try {
      const granted = await requestGalleryPermission();
      if (!granted) {
        showError(
          'Please allow photo library access to add a profile photo.',
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
      if (result.assets?.[0]?.uri) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      showError('Failed to open image picker');
    }
  };

  const handleSave = async () => {
    if (!form.district.trim() || !form.thana.trim()) {
      showError('Please select district and thana', 'Required');
      return;
    }

    const fields = {
      district: form.district.trim(),
      thana: form.thana.trim(),
      bio: form.bio.trim(),
      experience_years: String(form.experience_years.trim()),
      hourly_rate: String(form.hourly_rate.trim()),
      education: form.education.trim(),
      blood_group: form.blood_group,
      date_of_birth: form.date_of_birth.trim(),
      gender: normalizeGender(form.gender),
      service_areas: formatServiceAreasForApi(form.service_areas),
    };

    if (!isSetup) {
      fields.is_available = form.is_available === true;
    }

    const photoAsset =
      photo?.uri && !photo.remote && !String(photo.uri).startsWith('http')
        ? photo
        : null;

    try {
      const mutate = isSetup ? createMutation : updateMutation;
      const response = await mutate.mutateAsync({fields, photoAsset});
      const saved = response?.data || fields;
      completeCaregiverProfile(saved);
      if (!isSetup) {
        Alert.alert('Saved', 'Caregiver profile updated');
        navigation?.goBack();
      }
    } catch (error) {
      showError(error?.message || 'Failed to save profile');
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={saving} overlay />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <Header
          title={isSetup ? 'Complete your profile' : 'Caregiver profile'}
          showBack={!isSetup}
          leftIcon={isSetup ? 'person-outline' : undefined}
          onBack={() => navigation?.goBack()}
        />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {isSetup && (
            <Text style={styles.intro}>
              District and thana are required so families can find you.
            </Text>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.photoWrap}
            onPress={handleImagePick}>
            {photo?.uri ? (
              <Image source={{uri: photo.uri}} style={styles.photo} />
            ) : (
              <View style={styles.photoEmpty}>
                <Icon name="camera-outline" size={28} color="#008178" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Icon name="pencil" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Optional profile photo</Text>

          <SearchableDropdown
            label="District *"
            data={bangladeshDistricts}
            value={form.district}
            onSelect={value => updateField('district', value)}
            placeholder="Select district"
          />

          <SearchableDropdown
            label="Thana *"
            data={thanas}
            value={form.thana}
            onSelect={value => updateField('thana', value)}
            placeholder={form.district ? 'Select thana' : 'Select district first'}
          />

          <AppInput
            label="Bio"
            value={form.bio}
            onChangeText={text => updateField('bio', text)}
            placeholder="Short introduction"
            multiline
          />

          <AppInput
            label="Experience (years)"
            value={form.experience_years}
            onChangeText={text => updateField('experience_years', text)}
            placeholder="e.g. 5"
            keyboardType="numeric"
          />

          <AppInput
            label="Hourly rate (BDT)"
            value={form.hourly_rate}
            onChangeText={text => updateField('hourly_rate', text)}
            placeholder="e.g. 250"
            keyboardType="numeric"
          />

          <AppInput
            label="Education"
            value={form.education}
            onChangeText={text => updateField('education', text)}
            placeholder="e.g. HSC, caregiving certificate"
          />

          <Text style={styles.label}>Blood group</Text>
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

          <Text style={styles.label}>Gender</Text>
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

          <AppInput
            label="Date of birth"
            value={form.date_of_birth}
            onChangeText={text => updateField('date_of_birth', text)}
            placeholder="YYYY-MM-DD"
          />

          <AppInput
            label="Service areas"
            value={form.service_areas}
            onChangeText={text => updateField('service_areas', text)}
            placeholder="Dhaka or Dhaka,Mirpur"
          />

          {!isSetup && (
            <TouchableOpacity
              style={styles.availRow}
              onPress={() => updateField('is_available', !form.is_available)}>
              <View>
                <Text style={styles.availTitle}>Available for bookings</Text>
                <Text style={styles.availSub}>
                  {form.is_available
                    ? 'Families can assign new bookings to you'
                    : 'You will not receive new booking requests'}
                </Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  form.is_available && styles.toggleOn,
                ]}>
                <View
                  style={[
                    styles.toggleKnob,
                    form.is_available && styles.toggleKnobOn,
                  ]}
                />
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>

        <AppButtonBar>
          <AppButton
            title={isSetup ? 'Create profile' : 'Save changes'}
            onPress={handleSave}
            disabled={saving}
            style={styles.flexBtn}
          />
        </AppButtonBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CaregiverProfileScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  flex: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingBottom: 24},
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8190A7',
    marginBottom: 16,
  },
  photoWrap: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    marginTop: 4,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111820',
    marginBottom: 8,
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#E3E8F0',
  },
  chipActive: {
    backgroundColor: '#E6F4F3',
    borderColor: '#008178',
  },
  chipText: {fontSize: 13, fontWeight: '600', color: '#8190A7'},
  chipTextActive: {color: '#008178'},
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
  },
  availTitle: {fontSize: 15, fontWeight: '700', color: '#111820'},
  availSub: {fontSize: 12, color: '#8190A7', marginTop: 4, maxWidth: 240},
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {backgroundColor: '#008178'},
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobOn: {alignSelf: 'flex-end'},
  flexBtn: {flex: 1},
});
