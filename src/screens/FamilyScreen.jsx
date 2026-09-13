import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useFamilyMembers} from '../api/queries';
import Toast from '../components/common/Toast';
import FamilySkeleton from '../components/home/FamilySkeleton';
import Header from '../components/common/Header';

const FamilyScreen = ({navigation}) => {
  const [toast, setToast] = React.useState({visible: false, message: '', type: 'success'});

  // React Query hooks
  const {data: familyMembersData, isLoading} = useFamilyMembers();

  const familyMembers = Array.isArray(familyMembersData?.data)
    ? familyMembersData.data
    : [];

  const showToast = (message, type = 'success') => {
    setToast({visible: true, message, type});
  };

  const handleViewDetails = (member) => {
    navigation?.navigate('FamilyMemberDetails', {
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header
        title="Family"
        onBack={() => navigation?.goBack()}
        rightComponent={
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.addButton}
            onPress={() => navigation?.navigate('AddFamilyMember', {redirectBack: 'FamilyScreen'})}>
            <Icon name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        }
      />

      {/* ================= FAMILY LIST ================= */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <FamilySkeleton />
        ) : familyMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={64} color="#E3E8F0" />
            <Text style={styles.emptyTitle}>No Family Members</Text>
            <Text style={styles.emptyText}>
              Add your family members to get started
            </Text>
          </View>
        ) : (
          <View style={styles.familyGrid}>
            {familyMembers.map(member => (
              <TouchableOpacity
                key={member.id}
                activeOpacity={0.85}
                style={styles.familyCard}
                onPress={() => handleViewDetails(member)}>
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
                  <View style={styles.rightArrow}>
                    <Icon name="chevron-forward" size={24} color="#8190A7" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({...toast, visible: false})}
      />
    </SafeAreaView>
  );
};

export default FamilyScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // ================= HEADER =================
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172333',
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#008178',
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },

  // ================= SCROLL =================
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
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
});
