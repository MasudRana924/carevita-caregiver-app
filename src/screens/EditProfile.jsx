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
import {useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
import EditProfileSkeleton from '../components/home/EditProfileSkeleton';
import Header from '../components/common/Header';
import SearchableDropdown from '../components/common/SearchableDropdown';
import AppInput from '../components/common/AppInput';
import AppButton, {AppButtonBar} from '../components/common/AppButton';
import StatusModal from '../components/common/StatusModal';
import DateOfBirthPicker from '../components/common/DateOfBirthPicker';
import {bangladeshDistricts} from '../data/bangladeshLocations';
import {getThanasByDistrict} from '../data/bangladeshThanas';
import {useAuth} from '../context/AuthContext';
import {useCaregiverProfile} from '../api/queries';
import {accountService, caregiverService, unwrapData} from '../api/services';
import {queryKeys} from '../api/queryKeys';
import useAccountRefresh from '../hooks/useAccountRefresh';
import {
  GENDER_OPTIONS,
  formatDob,
  genderLabel,
  normalizeGenderValue,
  normalizeYmd,
} from '../utils/account';

const TEAL = '#0B8A80';
const PAGE_BG = '#FFFFFF';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => ({
  value: group,
  label: group,
}));
const MAX_NAME = 255;
const MAX_ADDRESS = 500;
const MAX_EMERGENCY = 20;

const EMPTY_ACCOUNT = {
  name: '',
  gender: '',
  date_of_birth: '',
  address: '',
  emergency_contact: '',
};

const EMPTY_PRO = {
  district: '',
  thana: '',
  bio: '',
  experience_years: '',
  hourly_rate: '',
  education: '',
  blood_group: '',
  service_areas: '',
};

// Checked in order so specific keys win over generic words like "name".
const ACCOUNT_ERROR_KEYS = [
  ['date_of_birth', ['date_of_birth', 'date of birth', 'birth']],
  ['emergency_contact', ['emergency']],
  ['gender', ['gender']],
  ['address', ['address']],
  ['name', ['name']],
];

const PRO_ERROR_KEYS = [
  ['hourly_rate', ['hourly_rate', 'hourly rate', 'rate']],
  ['experience_years', ['experience']],
  ['blood_group', ['blood']],
  ['service_areas', ['service_area', 'service area']],
  ['district', ['district']],
  ['thana', ['thana']],
  ['education', ['education']],
  ['bio', ['bio']],
];

const toText = value =>
  value === undefined || value === null ? '' : String(value);

const accountFormFrom = account => ({
  name: toText(account?.name),
  gender: normalizeGenderValue(account?.gender),
  date_of_birth: normalizeYmd(account?.date_of_birth),
  address: toText(account?.address),
  emergency_contact: toText(account?.emergency_contact),
});

const proFormFrom = profile => ({
  district: toText(profile?.district),
  thana: toText(profile?.thana),
  bio: toText(profile?.bio),
  experience_years: toText(profile?.experience_years),
  hourly_rate: toText(profile?.hourly_rate),
  education: toText(profile?.education),
  blood_group: toText(profile?.blood_group),
  service_areas: Array.isArray(profile?.service_areas)
    ? profile.service_areas.join(', ')
    : toText(profile?.service_areas),
});

const splitAreas = value =>
  String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

const toNumberOrNull = value => {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }
  const num = Number(raw);
  return Number.isFinite(num) ? num : raw;
};

/** Only changed account fields; cleared optional fields are sent as null. */
const diffAccount = (form, initial) => {
  const patch = {};
  Object.keys(EMPTY_ACCOUNT).forEach(key => {
    const next = String(form[key] || '').trim();
    const prev = String(initial[key] || '').trim();
    if (next !== prev) {
      patch[key] = next || (key === 'name' ? '' : null);
    }
  });
  return patch;
};

const diffPro = (form, initial) => {
  const patch = {};
  Object.keys(EMPTY_PRO).forEach(key => {
    const next = String(form[key] || '').trim();
    const prev = String(initial[key] || '').trim();
    if (key === 'service_areas') {
      if (splitAreas(next).join(',') !== splitAreas(prev).join(',')) {
        patch.service_areas = splitAreas(next);
      }
      return;
    }
    if (next === prev) {
      return;
    }
    if (key === 'experience_years' || key === 'hourly_rate') {
      patch[key] = toNumberOrNull(next);
    } else {
      patch[key] = next;
    }
  });
  return patch;
};

const matchErrorField = (message, table) => {
  const text = String(message || '').toLowerCase();
  const hit = table.find(([, words]) => words.some(word => text.includes(word)));
  return hit ? hit[0] : null;
};

const EditProfile = ({navigation}) => {
  const {completeCaregiverProfile} = useAuth();
  const queryClient = useQueryClient();
  const refreshAccount = useAccountRefresh();
  const {refetch: refetchCaregiver} = useCaregiverProfile({enabled: false});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState(null);
  const [hasProSection, setHasProSection] = useState(false);
  const [initialAccount, setInitialAccount] = useState(EMPTY_ACCOUNT);
  const [initialPro, setInitialPro] = useState(EMPTY_PRO);
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT);
  const [proForm, setProForm] = useState(EMPTY_PRO);
  const [errors, setErrors] = useState({});
  const [dobOpen, setDobOpen] = useState(false);
  const [bloodOpen, setBloodOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [status, setStatus] = useState({visible: false, title: '', message: ''});

  const showError = (message, title = 'Could not save') =>
    setStatus({visible: true, title, message});

  useEffect(() => {
    let active = true;
    (async () => {
      const [accountResult, proResult] = await Promise.allSettled([
        refreshAccount(),
        refetchCaregiver(),
      ]);
      if (!active) {
        return;
      }
      if (accountResult.status === 'fulfilled' && accountResult.value?.id) {
        const fresh = accountResult.value;
        const seeded = accountFormFrom(fresh);
        setAccount(fresh);
        setInitialAccount(seeded);
        setAccountForm(seeded);
      } else {
        showError(
          accountResult.reason?.message || 'Please check your connection and try again.',
          'Could not load your account',
        );
      }
      const profile =
        proResult.status === 'fulfilled' ? proResult.value?.data?.data : null;
      const proExists =
        Boolean(profile?.id || profile?.user_id) &&
        accountResult.value?.caregiver_profile_id !== null;
      setHasProSection(proExists);
      if (proExists) {
        const seededPro = proFormFrom(profile);
        setInitialPro(seededPro);
        setProForm(seededPro);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refreshAccount, refetchCaregiver]);

  const thanas = useMemo(
    () => getThanasByDistrict(proForm.district),
    [proForm.district],
  );

  const accountPatch = useMemo(
    () => diffAccount(accountForm, initialAccount),
    [accountForm, initialAccount],
  );
  const proPatch = useMemo(
    () => (hasProSection ? diffPro(proForm, initialPro) : {}),
    [hasProSection, proForm, initialPro],
  );
  const accountChanged = Object.keys(accountPatch).length > 0;
  const proChanged = Object.keys(proPatch).length > 0;
  const hasChanges = accountChanged || proChanged;

  const clearError = key =>
    setErrors(prev => {
      if (!prev[key]) {
        return prev;
      }
      const next = {...prev};
      delete next[key];
      return next;
    });

  const setAccountField = (key, value) => {
    setAccountForm(prev => ({...prev, [key]: value}));
    clearError(key);
  };

  const setProField = (key, value) => {
    setProForm(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'district' ? {thana: ''} : {}),
    }));
    clearError(key);
  };

  const validate = () => {
    const next = {};
    const name = accountForm.name.trim();
    if (!name) {
      next.name = 'Name cannot be empty';
    } else if (name.length > MAX_NAME) {
      next.name = `Name must be at most ${MAX_NAME} characters`;
    }
    if (accountForm.address.trim().length > MAX_ADDRESS) {
      next.address = `Address must be at most ${MAX_ADDRESS} characters`;
    }
    const emergency = accountForm.emergency_contact.trim();
    if (emergency && !/^\+?[0-9\s-]+$/.test(emergency)) {
      next.emergency_contact = 'Enter a valid phone number';
    }
    if (hasProSection && proChanged) {
      if (!proForm.district.trim()) {
        next.district = 'Please select a district';
      }
      if (!proForm.thana.trim()) {
        next.thana = 'Please select a thana';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const reportApiError = (error, table) => {
    const message = error?.message || 'Could not save your profile';
    const field = matchErrorField(message, table);
    if (field) {
      setErrors(prev => ({...prev, [field]: message}));
    }
    // iOS drops a modal presented while the saving loader modal is still dismissing.
    setTimeout(() => showError(message), 350);
  };

  const handleSave = async () => {
    if (!hasChanges || saving || !validate()) {
      return;
    }
    setSaving(true);
    try {
      if (accountChanged) {
        try {
          await accountService.updateMe(accountPatch);
          setInitialAccount({...accountForm});
        } catch (error) {
          reportApiError(error, ACCOUNT_ERROR_KEYS);
          return;
        }
      }
      if (proChanged) {
        try {
          await caregiverService.updateProfessionalProfile(proPatch);
          setInitialPro({...proForm});
        } catch (error) {
          reportApiError(error, PRO_ERROR_KEYS);
          return;
        }
      }

      await refreshAccount().catch(() => {});
      if (proChanged) {
        const res = await refetchCaregiver();
        const profile = unwrapData(res?.data);
        if (profile?.id || profile?.user_id) {
          completeCaregiverProfile(profile);
        }
      }
      queryClient.invalidateQueries({queryKey: queryKeys.caregiverProfile.all});
      navigation.navigate({
        name: 'Main',
        params: {screen: 'Profile', params: {successMessage: 'Profile updated'}},
        merge: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <Header title="Edit Profile" onBack={() => navigation?.goBack()} />
        <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={false}>
          <EditProfileSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
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
          <View style={styles.photoWrap}>
            {account?.profile_photo ? (
              <Image source={{uri: account.profile_photo}} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoFallback]}>
                <Icon name="person" size={36} color={TEAL} />
              </View>
            )}
            <Text style={styles.photoHint}>
              Change your photo from the camera icon on your Profile.
            </Text>
          </View>

          <SectionTitle title="Account details" />

          <AppInput
            label="Name *"
            icon="person-outline"
            value={accountForm.name}
            onChangeText={text => setAccountField('name', text)}
            placeholder="Enter full name"
            autoCapitalize="words"
            maxLength={MAX_NAME}
          />
          <FieldError message={errors.name} />

          <FieldLabel icon="male-female-outline" label="Gender" />
          <TouchableOpacity style={styles.selectorField} onPress={() => setGenderOpen(true)}>
            <View style={styles.selectorContent}>
              <Text
                style={[styles.selectorValue, !accountForm.gender && styles.selectorPlaceholder]}>
                {accountForm.gender ? genderLabel(accountForm.gender) : 'Select gender'}
              </Text>
              <Icon name="chevron-down" size={20} color="#8A97A6" />
            </View>
          </TouchableOpacity>
          <FieldError message={errors.gender} />

          <FieldLabel icon="calendar-outline" label="Date of birth" />
          <TouchableOpacity style={styles.selectorField} onPress={() => setDobOpen(true)}>
            <View style={styles.selectorContent}>
              <Text
                style={[
                  styles.selectorValue,
                  !accountForm.date_of_birth && styles.selectorPlaceholder,
                ]}>
                {formatDob(accountForm.date_of_birth) || 'Select date of birth'}
              </Text>
              <Icon name="calendar-outline" size={18} color="#8A97A6" />
            </View>
          </TouchableOpacity>
          <FieldError message={errors.date_of_birth} />

          <AppInput
            label="Address"
            icon="home-outline"
            value={accountForm.address}
            onChangeText={text => setAccountField('address', text)}
            placeholder="House, road, area"
            multiline
            maxLength={MAX_ADDRESS}
          />
          <FieldError message={errors.address} />

          <AppInput
            label="Emergency contact"
            icon="call-outline"
            value={accountForm.emergency_contact}
            onChangeText={text => setAccountField('emergency_contact', text)}
            placeholder="01XXXXXXXXX"
            keyboardType="phone-pad"
            maxLength={MAX_EMERGENCY}
          />
          <FieldError message={errors.emergency_contact} />

          <AppInput
            label="Email"
            icon="mail-outline"
            value={toText(account?.email)}
            editable={false}
            placeholder="Not set"
            inputRowStyle={styles.readOnly}
            inputStyle={styles.readOnlyText}
            rightIcon="lock-closed-outline"
          />
          <AppInput
            label="Phone"
            icon="phone-portrait-outline"
            value={toText(account?.phone)}
            editable={false}
            placeholder="Not set"
            inputRowStyle={styles.readOnly}
            inputStyle={styles.readOnlyText}
            rightIcon="lock-closed-outline"
          />

          {hasProSection ? (
            <>
              <SectionTitle title="Professional details" />

              <SearchableDropdown
                label="District *"
                data={bangladeshDistricts}
                value={proForm.district}
                onSelect={value => setProField('district', value)}
                placeholder="Select district"
                containerStyle={styles.dropdown}
              />
              <FieldError message={errors.district} />

              <SearchableDropdown
                label="Thana *"
                data={thanas}
                value={proForm.thana}
                onSelect={value => setProField('thana', value)}
                placeholder={proForm.district ? 'Select thana' : 'Select district first'}
                containerStyle={styles.dropdown}
              />
              <FieldError message={errors.thana} />

              <AppInput
                label="Hourly rate (BDT)"
                icon="cash-outline"
                value={proForm.hourly_rate}
                onChangeText={text => setProField('hourly_rate', text.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 250"
                keyboardType="numeric"
              />
              <FieldError message={errors.hourly_rate} />

              <AppInput
                label="Bio"
                icon="document-text-outline"
                value={proForm.bio}
                onChangeText={text => setProField('bio', text)}
                placeholder="Short introduction about your caregiving experience"
                multiline
              />
              <FieldError message={errors.bio} />

              <AppInput
                label="Experience (years)"
                icon="briefcase-outline"
                value={proForm.experience_years}
                onChangeText={text =>
                  setProField('experience_years', text.replace(/[^0-9]/g, ''))
                }
                placeholder="e.g. 5"
                keyboardType="numeric"
              />
              <FieldError message={errors.experience_years} />

              <AppInput
                label="Service areas"
                icon="map-outline"
                value={proForm.service_areas}
                onChangeText={text => setProField('service_areas', text)}
                placeholder="Dhaka, Mirpur"
              />
              <FieldError message={errors.service_areas} />

              <AppInput
                label="Education"
                icon="school-outline"
                value={proForm.education}
                onChangeText={text => setProField('education', text)}
                placeholder="e.g. HSC, caregiving certificate"
              />
              <FieldError message={errors.education} />

              <FieldLabel icon="water-outline" label="Blood group" />
              <TouchableOpacity style={styles.selectorField} onPress={() => setBloodOpen(true)}>
                <View style={styles.selectorContent}>
                  <Text
                    style={[
                      styles.selectorValue,
                      !proForm.blood_group && styles.selectorPlaceholder,
                    ]}>
                    {proForm.blood_group || 'Select blood group'}
                  </Text>
                  <Icon name="chevron-down" size={20} color="#8A97A6" />
                </View>
              </TouchableOpacity>
              <FieldError message={errors.blood_group} />
            </>
          ) : account?.caregiver_profile_id === null ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.setupCard}
              onPress={() => navigation?.navigate('CaregiverProfile', {mode: 'setup'})}>
              <Icon name="alert-circle-outline" size={20} color="#D97706" />
              <Text style={styles.setupText}>
                Complete your caregiver profile to add your rate, area and experience.
              </Text>
              <Icon name="chevron-forward" size={18} color="#D97706" />
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        <AppButtonBar>
          <AppButton
            title="Save"
            onPress={handleSave}
            disabled={!hasChanges || saving}
            style={styles.flexBtn}
          />
        </AppButtonBar>
      </KeyboardAvoidingView>

      <StatusModal
        visible={status.visible}
        type="error"
        title={status.title}
        message={status.message}
        onClose={() => setStatus(prev => ({...prev, visible: false}))}
      />

      <DateOfBirthPicker
        visible={dobOpen}
        value={accountForm.date_of_birth}
        onClose={() => setDobOpen(false)}
        onChange={value => setAccountField('date_of_birth', value)}
      />

      <OptionSheet
        visible={genderOpen}
        title="Select Gender"
        options={GENDER_OPTIONS}
        value={accountForm.gender}
        onClose={() => setGenderOpen(false)}
        onSelect={value => setAccountField('gender', value)}
      />

      <OptionSheet
        visible={bloodOpen}
        title="Select Blood Group"
        options={BLOOD_GROUPS}
        value={proForm.blood_group}
        onClose={() => setBloodOpen(false)}
        onSelect={value => setProField('blood_group', value)}
      />
    </SafeAreaView>
  );
};

const OptionSheet = ({visible, title, options, value, onClose, onSelect}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <SafeAreaView style={styles.bottomSheetContainer} edges={['bottom']}>
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          <Text style={styles.bottomSheetTitle}>{title}</Text>
          <ScrollView style={styles.optionsList}>
            {options.map(option => {
              const active = value === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}>
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                  {active && <Icon name="checkmark" size={20} color={TEAL} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </TouchableOpacity>
  </Modal>
);

const SectionTitle = ({title}) => <Text style={styles.sectionTitle}>{title}</Text>;

const FieldLabel = ({icon, label}) => (
  <View style={styles.labelRow}>
    <Icon name={icon} size={14} color="#8A97A6" />
    <Text style={styles.label}>{label}</Text>
  </View>
);

const FieldError = ({message}) =>
  message ? <Text style={styles.fieldError}>{message}</Text> : null;

export default EditProfile;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: PAGE_BG},
  flex: {flex: 1},
  scrollContent: {paddingHorizontal: 16, paddingBottom: 24},
  photoWrap: {alignItems: 'center', paddingVertical: 12},
  photo: {width: 88, height: 88, borderRadius: 44, backgroundColor: '#E8F3F1'},
  photoFallback: {alignItems: 'center', justifyContent: 'center'},
  photoHint: {marginTop: 8, fontSize: 12, color: '#8A97A6', textAlign: 'center'},
  sectionTitle: {
    marginTop: 14,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#15202B',
  },
  dropdown: {marginBottom: 8},
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  label: {fontSize: 13, fontWeight: '700', color: '#15202B'},
  fieldError: {
    marginTop: -2,
    marginBottom: 8,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  readOnly: {backgroundColor: '#F4F6F8'},
  readOnlyText: {color: '#8A97A6'},
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
  selectorValue: {fontSize: 15, fontWeight: '600', color: '#15202B'},
  selectorPlaceholder: {color: '#9AA5B1', fontWeight: '500'},
  setupCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF4E5',
  },
  setupText: {flex: 1, fontSize: 13, color: '#92400E', fontWeight: '600'},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {paddingHorizontal: 15, paddingBottom: 20},
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
  optionsList: {paddingHorizontal: 20},
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {fontSize: 16, fontWeight: '600', color: '#374151'},
  optionTextActive: {color: TEAL},
  flexBtn: {flex: 1},
});
