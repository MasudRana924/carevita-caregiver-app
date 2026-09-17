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

const TEAL = '#0B8A80';
const PAGE_BG = '#F4F8F7';

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

const getSettings = navigation => [
  {
    id: 'edit',
    name: 'Edit account',
    subtitle: 'Name, address & photo',
    icon: 'person-outline',
    onPress: () => navigation?.navigate('EditProfile'),
  },
  {
    id: 'caregiver',
    name: 'Caregiver profile',
    subtitle: 'District, rate, availability',
    icon: 'briefcase-outline',
    onPress: () => navigation?.navigate('CaregiverProfile', {mode: 'edit'}),
  },
  {
    id: 'hours',
    name: 'Weekly availability',
    subtitle: 'Set hours bookings can start',
    icon: 'time-outline',
    onPress: () => navigation?.navigate('Availability'),
  },
  {
    id: 'reviews',
    name: 'Reviews',
    subtitle: 'Ratings and comments from families',
    icon: 'star-outline',
    onPress: () => navigation?.navigate('Reviews'),
  },
  {
    id: 'notifications',
    name: 'Notification mute',
    subtitle: 'Choose which push alerts you get',
    icon: 'notifications-outline',
    onPress: () => navigation?.navigate('NotificationPreferences'),
  },
  {
    id: 'password',
    name: 'Change password',
    subtitle: 'Update your login password',
    icon: 'lock-closed-outline',
    onPress: () => navigation?.navigate('ChangePassword'),
  },
];

const ProfileScreen = ({navigation}) => {
  const {logout, user} = useAuth();
  const {data: profileData, isLoading} = useUserProfile();
  const {data: caregiverData} = useCaregiverProfile();
  useState(null);

  const authUser = profileData?.data || user || {};
  const caregiver = caregiverData?.data || {};
  const photo = authUser.profile_photo || caregiver.profile_photo;
  const isActive =
    caregiver.verification_status === 'APPROVED' ||
    caregiver.verification_status === 'VERIFIED' ||
    authUser.is_verified === true;
  const settings = getSettings(navigation);

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          {photo ? (
            <Image source={{uri: photo}} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(authUser.name)}
              </Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {isLoading ? 'Loading...' : authUser.name || 'Your profile'}
            </Text>
            {!!authUser.email && (
              <View style={styles.emailRow}>
                <Icon name="mail-outline" size={13} color="#8A97A6" />
                <Text style={styles.email} numberOfLines={1}>
                  {authUser.email}
                </Text>
              </View>
            )}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {backgroundColor: isActive ? '#22C55E' : '#F59E0B'},
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {color: isActive ? '#22C55E' : '#F59E0B'},
                ]}>
                {isActive ? 'Active' : 'Pending'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.editCircle}
            onPress={() => navigation?.navigate('EditProfile')}>
            <Icon name="pencil-outline" size={16} color={TEAL} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.accountCard}
          onPress={() =>
            navigation?.navigate('CaregiverProfile', {mode: 'edit'})
          }>
          <View style={styles.accountIcon}>
            <Icon name="person-outline" size={20} color={TEAL} />
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountTitle}>Caregiver Account</Text>
            <Text style={styles.accountSub}>
              Manage your profile, preferences and account settings
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color="#B7C2CC" />
        </TouchableOpacity>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
        </View>

        {settings.map(item => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            style={styles.settingCard}
            onPress={item.onPress}>
            <View style={styles.settingIcon}>
              <Icon name={item.icon} size={18} color={TEAL} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>{item.name}</Text>
              <Text style={styles.settingSub}>{item.subtitle}</Text>
            </View>
            <Icon name="chevron-forward" size={18} color="#C5CED6" />
          </TouchableOpacity>
        ))}

        <Text style={styles.version}>Nirapod Caregiver v1.0.0</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.logoutButton}
          onPress={handleLogout}>
          <Icon name="log-out-outline" size={18} color="#E74C3C" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: PAGE_BG},
  scrollContent: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32},
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {width: 56, height: 56, borderRadius: 28},
  avatarText: {fontSize: 18, fontWeight: '800', color: '#FFFFFF'},
  profileInfo: {flex: 1, marginLeft: 12, marginRight: 8},
  profileName: {fontSize: 17, fontWeight: '800', color: '#15202B'},
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  email: {flex: 1, fontSize: 12, color: '#8A97A6'},
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  statusDot: {width: 7, height: 7, borderRadius: 4},
  statusText: {fontSize: 12, fontWeight: '700'},
  editCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F8F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F3F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountCopy: {flex: 1, marginRight: 8},
  accountTitle: {fontSize: 15, fontWeight: '800', color: '#15202B'},
  accountSub: {marginTop: 3, fontSize: 12, lineHeight: 16, color: '#8A97A6'},
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
    gap: 8,
  },
  sectionBar: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: TEAL,
  },
  sectionTitle: {fontSize: 16, fontWeight: '800', color: '#15202B'},
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F3F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingCopy: {flex: 1, marginRight: 8},
  settingTitle: {fontSize: 14, fontWeight: '700', color: '#15202B'},
  settingSub: {marginTop: 2, fontSize: 12, color: '#8A97A6'},
  version: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 12,
    fontSize: 12,
    color: '#8A97A6',
  },
  logoutButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FDECEC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {fontSize: 15, fontWeight: '700', color: '#E74C3C'},
});
