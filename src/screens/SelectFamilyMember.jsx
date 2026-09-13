import React, {useState} from 'react';
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
import {useFamilyMembers} from '../api/queries';
import Header from '../components/common/Header';
import FamilySkeleton from '../components/home/FamilySkeleton';
import {storage} from '../utils/storage';

const SelectFamilyMember = ({navigation, route}) => {
  const [selectedMember, setSelectedMember] = useState(route.params?.selectedMember);
  const {selectedCaregiver} = route.params || {};
  const {data: familyMembersData, isLoading} = useFamilyMembers();
  const familyMembers = Array.isArray(familyMembersData?.data)
    ? familyMembersData.data
    : [];

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

  const handleNext = () => {
    if (selectedMember) {
      storage.saveSelectedFamilyMember(selectedMember);
      if (selectedCaregiver) {
        navigation?.navigate('SelectService', {
          selectedMember,
          selectedCaregiver,
          serviceType: route.params?.serviceType,
        });
      } else {
        navigation?.navigate('SelectService', {
          selectedMember,
          serviceType: route.params?.serviceType || 'caregiver',
        });
      }
    }
  };

  const handleViewDetails = (member) => {
    navigation?.navigate('FamilyMemberDetails', {
      memberId: member.id,
    });
  };

  const handleAddMember = () => {
    navigation?.navigate('AddFamilyMember', {
      redirectBack: 'SelectFamilyMember',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="Select Family Member" onBack={() => navigation?.goBack()} />

      {/* ================= FAMILY LIST ================= */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
          <View>
            <Text style={styles.sectionTitle}>Who needs assistance?</Text>
          </View>
        {isLoading ? (
          <FamilySkeleton />
        ) : familyMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={64} color="#E3E8F0" />
            <Text style={styles.emptyTitle}>No Family Members</Text>
            <Text style={styles.emptyText}>
              Add your family members to get started
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.addButton}
              onPress={handleAddMember}>
              <Icon name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Family Member</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.familyGrid}>
            {familyMembers.map(member => (
              <TouchableOpacity
                key={member.id}
                activeOpacity={0.85}
                style={[
                  styles.familyCard,
                  selectedMember?.id === member.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedMember(member)}>
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.avatarContainer}>
                      {member.photo ? (
                        <Image source={{uri: member.photo}} style={styles.avatar} />
                      ) : (
                        <View style={styles.placeholderAvatar}>
                          <Icon name="person" size={24} color="#8190A7" />
                        </View>
                      )}
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.name}>{member.name}</Text>
                      <Text style={styles.relation}>{member.relationship}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.rightArrow}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleViewDetails(member);
                    }}>
                    <Icon name="chevron-forward" size={24} color="#8190A7" />
                  </TouchableOpacity>
                </View>
                {/* {selectedMember?.id === member.id && (
                  <View style={styles.selectedBadge}>
                    <Icon name="checkmark-circle" size={24} color="#008178" />
                  </View>
                )} */}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ================= NEXT BUTTON ================= */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.nextButton,
            !selectedMember && styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={!selectedMember}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SelectFamilyMember;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // ================= SCROLL =================
  scrollView: {
    flex: 1,
  },

  sectionTitle:{
    fontSize: 12,
    fontWeight: '500',
    color: '#172333',
    marginBottom: 15,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  // ================= LOADING =================
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  loadingText: {
    fontSize: 16,
    color: '#8190A7',
  },

  // ================= EMPTY STATE =================
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#172333',
    marginTop: 16,
  },

  emptyText: {
    fontSize: 14,
    color: '#8190A7',
    marginTop: 8,
    marginBottom: 24,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#008178',
  },

  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // ================= FAMILY GRID =================
  familyGrid: {
    flexDirection: 'column',
  },

  familyCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E3E8F0',
    marginBottom: 12,
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  selectedCard: {
    borderColor: '#008178',
    borderWidth: 2,
  },

  selectedBadge: {
    marginLeft: 8,
    marginTop: 2,
  },

  // ================= CARD HEADER =================
  cardHeader: {
    width: '100%',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  avatarContainer: {
    width: 56,
    height: 56,
    marginRight: 12,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E5E5',
  },

  placeholderAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  userInfo: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 4,
  },

  relation: {
    fontSize: 14,
    color: '#8190A7',
  },

  rightArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ================= BOTTOM =================
  bottomContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  nextButton: {
    backgroundColor: '#008178',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },

  disabledButton: {
    backgroundColor: '#B5C0D0',
  },

  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
