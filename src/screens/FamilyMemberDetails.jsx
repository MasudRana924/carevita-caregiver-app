import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';
import {useFamilyMember} from '../api/queries';
import FamilyDetailsSkeleton from '../components/home/FamilyDetailsSkeleton';

const DetailRow = ({label, value, icon}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailRowLeft}>
      <View style={styles.detailIcon}>
        <Icon name={icon} size={18} color="#008178" />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value || '—'}</Text>
  </View>
);

const FamilyMemberDetails = ({navigation, route}) => {
  const {memberId} = route.params || {};
  const {data: memberData, isLoading} = useFamilyMember(memberId);
  const member = memberData?.data;

  const handleEdit = () => {
    navigation?.navigate('AddFamilyMember', {
      memberId: member.id,
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <Header title="Member Details" onBack={() => navigation?.goBack()} />
        <FamilyDetailsSkeleton />
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <Header title="Member Details" onBack={() => navigation?.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Member not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header
        title="Member Details"
        onBack={() => navigation?.goBack()}
        rightComponent={
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleEdit}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {member.photo ? (
            <Image source={{uri: member.photo}} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profilePhotoEmpty}>
              <Icon name="person" size={40} color="#8190A7" />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{member.name}</Text>
            <Text style={styles.profileRelation}>{member.relationship}</Text>
            {member.blood_group && (
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodText}>{member.blood_group}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <DetailRow
            label="Gender"
            value={member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : '—'}
            icon="person-outline"
          />
          <DetailRow
            label="Date of Birth"
            value={member.date_of_birth ? member.date_of_birth.split('T')[0] : '—'}
            icon="calendar-outline"
          />
          <DetailRow
            label="Age"
            value={calculateAge(member.date_of_birth)}
            icon="hourglass-outline"
          />
          <DetailRow
            label="Phone"
            value={member.phone || '—'}
            icon="call-outline"
          />
          <DetailRow
            label="District"
            value={member.district || '—'}
            icon="location-outline"
          />
          <DetailRow
            label="Thana"
            value={member.thana || '—'}
            icon="navigate-outline"
          />
          <DetailRow
            label="House"
            value={member.house || '—'}
            icon="home-outline"
          />
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <DetailRow
            label="Contact Name"
            value={member.emergency_contact_name || '—'}
            icon="person-circle-outline"
          />
          <DetailRow
            label="Contact Phone"
            value={member.emergency_contact_phone || '—'}
            icon="call-outline"
          />
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <DetailRow
            label="Medical History"
            value={member.medical_history || 'None'}
            icon="medkit-outline"
          />
          <DetailRow
            label="Existing Conditions"
            value={member.existing_conditions || 'None'}
            icon="pulse-outline"
          />
          <DetailRow
            label="Allergies"
            value={member.allergies || 'None'}
            icon="alert-circle-outline"
          />
          <DetailRow
            label="Current Medications"
            value={member.current_medications || 'None'}
            icon="medication-outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FamilyMemberDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8190A7',
  },
  editButton: {
    fontSize: 15,
    fontWeight: '600',
    color: '#008178',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  profilePhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profilePhotoEmpty: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 4,
  },
  profileRelation: {
    fontSize: 15,
    color: '#8190A7',
    marginBottom: 8,
  },
  bloodBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EAF3FF',
    borderWidth: 1,
    borderColor: '#D8E7FA',
  },
  bloodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#43658B',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8190A7',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111820',
    textAlign: 'right',
    flex: 1,
  },
});
