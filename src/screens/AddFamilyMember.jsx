import React, {useState, useEffect, useMemo} from 'react';
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
import SearchableDropdown from '../components/common/SearchableDropdown';
import {launchImageLibrary} from 'react-native-image-picker';
import {useAddFamilyMember, useUpdateFamilyMember} from '../api/mutations';
import {useFamilyMember} from '../api/queries';
import Toast from '../components/common/Toast';
import Header from '../components/common/Header';
import {requestGalleryPermission} from '../utils/permissions';
import FamilyDetailsSkeleton from '../components/home/FamilyDetailsSkeleton';
import {bangladeshDistricts} from '../data/bangladeshLocations';
import {getThanasByDistrict} from '../data/bangladeshThanas';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELATIONSHIPS = ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];

const AddFamilyMember = ({navigation, route}) => {
  const {memberId, redirectBack} = route.params || {};
  const isEditMode = !!memberId;

  const addMutation = useAddFamilyMember();
  const updateMutation = useUpdateFamilyMember();
  const {data: memberData, isLoading: memberLoading} = useFamilyMember(isEditMode ? memberId : null);

  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success',
  });
  const [imageUri, setImageUri] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phone: '',
    blood_group: '',
    date_of_birth: '',
    gender: '',
    district: '',
    thana: '',
    house: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    existing_conditions: '',
    allergies: '',
    current_medications: '',
  });

  useEffect(() => {
    if (isEditMode && memberData?.data) {
      const member = memberData.data;
      setFormData({
        name: member.name || '',
        relationship: member.relationship || '',
        phone: member.phone || '',
        blood_group: member.blood_group || '',
        date_of_birth: member.date_of_birth
          ? String(member.date_of_birth).split('T')[0]
          : '',
        gender: member.gender || '',
        district: member.district || '',
        thana: member.thana || '',
        house: member.house || '',
        emergency_contact_name: member.emergency_contact_name || '',
        emergency_contact_phone: member.emergency_contact_phone || '',
        medical_history: member.medical_history || '',
        existing_conditions: member.existing_conditions || '',
        allergies: member.allergies || '',
        current_medications: member.current_medications || '',
      });
      if (member.photo) {
        setImageUri(member.photo);
      }
    }
  }, [isEditMode, memberData]);

  const thanaOptions = useMemo(
    () => getThanasByDistrict(formData.district),
    [formData.district],
  );

  const handleImagePick = async () => {
    try {
      const granted = await requestGalleryPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo library access to add a photo.',
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

  const handleSubmit = async () => {
    const {
      name,
      relationship,
      phone,
      blood_group,
      date_of_birth,
      gender,
      district,
      thana,
      house,
      emergency_contact_name,
      emergency_contact_phone,
      medical_history,
      existing_conditions,
      allergies,
      current_medications,
    } = formData;

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter name');
      return;
    }
    if (!relationship.trim()) {
      Alert.alert('Error', 'Please select relationship');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    try {
      const data = new FormData();
      data.append('name', name);
      data.append('relationship', relationship);
      data.append('phone', phone);
      if (blood_group) data.append('blood_group', blood_group);
      if (date_of_birth) data.append('date_of_birth', date_of_birth);
      if (gender) data.append('gender', gender.toLowerCase());
      if (district) data.append('district', district);
      if (thana) data.append('thana', thana);
      if (house) data.append('house', house);
      if (emergency_contact_name) data.append('emergency_contact_name', emergency_contact_name);
      if (emergency_contact_phone) data.append('emergency_contact_phone', emergency_contact_phone);
      if (medical_history) data.append('medical_history', medical_history);
      if (existing_conditions) data.append('existing_conditions', existing_conditions);
      if (allergies) data.append('allergies', allergies);
      if (current_medications) data.append('current_medications', current_medications);

      if (imageUri && !String(imageUri).startsWith('http')) {
        data.append('photo', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        });
      }

      if (isEditMode) {
        await updateMutation.mutateAsync({id: memberId, formData: data});
        showToast('Family member updated successfully');
      } else {
        await addMutation.mutateAsync(data);
        showToast('Family member added successfully');
      }
      navigation?.goBack();
    } catch (error) {
      console.error('Failed to save family member:', error);
      showToast(
        error?.message ||
          (isEditMode
            ? 'Failed to update family member'
            : 'Failed to add family member'),
        'error',
      );
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  if (isEditMode && memberLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <Header
          title="Edit family member"
          onBack={() => navigation?.goBack()}
        />
        <FamilyDetailsSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={isPending} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <Header
          title={isEditMode ? 'Edit family member' : 'Add family member'}
          onBack={() => navigation?.goBack()}
        />

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
          <Text style={styles.photoHint}>Tap to add photo</Text>

          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={text => setFormData({...formData, name: text})}
            placeholder="Enter name"
            placeholderTextColor="#8190A7"
          />

          <Text style={styles.label}>Relationship *</Text>
          <SearchableDropdown
            data={RELATIONSHIPS}
            placeholder="Select relationship"
            value={formData.relationship}
            onSelect={value => setFormData({...formData, relationship: value})}
            icon="person-outline"
          />

          <Text style={styles.label}>Phone *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={text => setFormData({...formData, phone: text})}
            placeholder="Enter phone number"
            placeholderTextColor="#8190A7"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Blood group</Text>
          <SearchableDropdown
            data={BLOOD_GROUPS}
            placeholder="Select blood group"
            value={formData.blood_group}
            onSelect={value => setFormData({...formData, blood_group: value})}
            icon="water-outline"
          />

          <Text style={styles.label}>Date of birth</Text>
          <TextInput
            style={styles.input}
            value={formData.date_of_birth}
            onChangeText={text =>
              setFormData({...formData, date_of_birth: text})
            }
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#8190A7"
          />

          <Text style={styles.label}>Gender</Text>
          <SearchableDropdown
            data={GENDERS}
            placeholder="Select gender"
            value={formData.gender}
            onSelect={value => setFormData({...formData, gender: value})}
            icon="person-outline"
          />

          <Text style={styles.label}>District</Text>
          <SearchableDropdown
            data={bangladeshDistricts}
            placeholder="Select district"
            value={formData.district}
            onSelect={value =>
              setFormData({...formData, district: value, thana: ''})
            }
            icon="location-outline"
          />

          <Text style={styles.label}>Thana</Text>
          <SearchableDropdown
            data={thanaOptions}
            placeholder={
              formData.district ? 'Select thana' : 'Select district first'
            }
            value={formData.thana}
            onSelect={value => setFormData({...formData, thana: value})}
            icon="navigate-outline"
          />

          <Text style={styles.label}>House</Text>
          <TextInput
            style={styles.input}
            value={formData.house}
            onChangeText={text => setFormData({...formData, house: text})}
            placeholder="House, road, block..."
            placeholderTextColor="#8190A7"
          />

          <Text style={styles.label}>Emergency contact name</Text>
          <TextInput
            style={styles.input}
            value={formData.emergency_contact_name}
            onChangeText={text => setFormData({...formData, emergency_contact_name: text})}
            placeholder="Enter emergency contact name"
            placeholderTextColor="#8190A7"
          />

          <Text style={styles.label}>Emergency contact phone</Text>
          <TextInput
            style={styles.input}
            value={formData.emergency_contact_phone}
            onChangeText={text =>
              setFormData({...formData, emergency_contact_phone: text})
            }
            placeholder="Enter emergency contact phone"
            placeholderTextColor="#8190A7"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Medical history</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.medical_history}
            onChangeText={text => setFormData({...formData, medical_history: text})}
            placeholder="Notes or medical information"
            placeholderTextColor="#8190A7"
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Existing conditions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.existing_conditions}
            onChangeText={text => setFormData({...formData, existing_conditions: text})}
            placeholder="Any existing medical conditions"
            placeholderTextColor="#8190A7"
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Allergies</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.allergies}
            onChangeText={text => setFormData({...formData, allergies: text})}
            placeholder="Any known allergies"
            placeholderTextColor="#8190A7"
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Current medications</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.current_medications}
            onChangeText={text => setFormData({...formData, current_medications: text})}
            placeholder="Current medications"
            placeholderTextColor="#8190A7"
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isPending}>
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Update member' : 'Add member'}
            </Text>
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

export default AddFamilyMember;

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
    paddingBottom: 24,
  },
  photoWrap: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
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
  textArea: {
    height: 100,
    paddingTop: 14,
  },
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
  disabledButton: {
    backgroundColor: '#B5C0D0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
