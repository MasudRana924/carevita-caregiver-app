import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../context/AuthContext';
import {useUserProfile, useCaregiverProfile} from '../api/queries';
import Toast from '../components/common/Toast';

const ProfileScreen = ({navigation}) => {
  const {logout, user} = useAuth();
  const {data: profileData, isLoading} = useUserProfile();
  const {data: caregiverData} = useCaregiverProfile();
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success',
  });

  const authUser = profileData?.data || user || {};
  const caregiver = caregiverData?.data || {};

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const getInitials = name => {
    if (!name) {
      return 'C';
    }
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const photo = authUser.profile_photo || caregiver.profile_photo;
  const verification = caregiver.verification_status || 'PENDING';

  const menuItems = [
    {
      id: 'edit',
      name: 'Edit account',
      subtitle: 'Name, language, address & photo',
      icon: 'person-outline',
      onPress: () => navigation?.navigate('EditProfile'),
    },
    {
      id: 'caregiver',
      name: 'Caregiver profile',
      subtitle: 'District, rate, availability',
      icon: 'medkit-outline',
      onPress: () => navigation?.navigate('CaregiverProfile', {mode: 'edit'}),
    },
    {
      id: 'password',
      name: 'Change password',
      subtitle: 'Update your login password',
      icon: 'lock-closed-outline',
      onPress: () => navigation?.navigate('ChangePassword'),
    },
    {
      id: 'wallet',
      name: 'Wallet',
      subtitle: 'Earnings and transactions',
      icon: 'wallet-outline',
      onPress: () => navigation?.navigate('Wallet'),
    },
    {
      id: 'bookings',
      name: 'My bookings',
      subtitle: 'Requests and history',
      icon: 'calendar-outline',
      onPress: () => navigation?.navigate('Bookings'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My account</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          {photo ? (
            <Image source={{uri: photo}} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(authUser.name)}</Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {isLoading ? 'Loading...' : authUser.name || 'Your profile'}
            </Text>
            <Text style={styles.profileMeta} numberOfLines={1}>
              {authUser.email || ''}
            </Text>
            <View style={styles.verifyBadge}>
              <Text style={styles.verifyText}>
                {String(verification).replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.editIcon}
            onPress={() => navigation?.navigate('EditProfile')}>
            <Icon name="pencil-outline" size={18} color="#008178" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}>
              <View style={styles.menuIconBg}>
                <Icon name={item.icon} size={20} color="#008178" />
              </View>
              <View style={styles.menuTextBlock}>
                <Text style={styles.menuText}>{item.name}</Text>
                {!!item.subtitle && (
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                )}
              </View>
              <Icon name="chevron-forward" size={18} color="#8190A7" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>Nirapod Caregiver v1.0.0</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.logoutButton}
          onPress={handleLogout}>
          <Icon name="log-out-outline" size={20} color="#E74C3C" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({...toast, visible: false})}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111820',
    letterSpacing: -0.3,
  },
  scrollContent: {paddingHorizontal: 16, paddingBottom: 28},
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    padding: 14,
    marginBottom: 22,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {width: 52, height: 52, borderRadius: 26},
  avatarText: {fontSize: 18, fontWeight: '700', color: '#FFFFFF'},
  profileInfo: {flex: 1, marginLeft: 12, marginRight: 8},
  profileName: {fontSize: 16, fontWeight: '700', color: '#111820'},
  profileMeta: {fontSize: 12, color: '#8190A7', marginTop: 2},
  verifyBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: '#E6F4F3',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#008178',
    textTransform: 'capitalize',
  },
  editIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8190A7',
    marginBottom: 10,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  menuItemLast: {borderBottomWidth: 0},
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextBlock: {flex: 1, marginLeft: 12, marginRight: 8},
  menuText: {fontSize: 15, fontWeight: '600', color: '#111820'},
  menuSubtitle: {fontSize: 12, color: '#8190A7', marginTop: 2},
  versionRow: {alignItems: 'center', marginTop: 20},
  versionText: {fontSize: 12, color: '#8190A7'},
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FCDEDE',
    gap: 8,
  },
  logoutText: {fontSize: 16, fontWeight: '600', color: '#E74C3C'},
});
