import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useAuth} from '../context/AuthContext';
import {
  useMyAccount,
  useCaregiverProfile,
  useConversationUnreadCount,
} from '../api/queries';
import {accountService} from '../api/services';
import {queryKeys} from '../api/queryKeys';
import {unreadCountFromQuery} from '../utils/supportChat';
import {
  PROFILE_PHOTO_PICKER_OPTIONS,
  formatDob,
  genderLabel,
  prepareProfilePhoto,
} from '../utils/account';
import {
  requestCameraPermission,
  requestGalleryPermission,
} from '../utils/permissions';
import useAccountRefresh from '../hooks/useAccountRefresh';
import Header from '../components/common/Header';
import StatusModal from '../components/common/StatusModal';
import LogoutConfirmModal from '../components/common/LogoutConfirmModal';

const TEAL = '#0B8A80';
const PAGE_BG = '#FFFFFF';
const AVATAR = 68;

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
    id: 'wallet',
    name: 'Wallet',
    subtitle: 'Earnings and withdrawals',
    icon: 'wallet-outline',
    onPress: () => navigation?.navigate('Wallet'),
  },
  {
    id: 'hours',
    name: 'Weekly availability',
    subtitle: 'Choose the days you work',
    icon: 'calendar-outline',
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
  // {
  //   id: 'password',
  //   name: 'Change password',
  //   subtitle: 'Update your login password',
  //   icon: 'lock-closed-outline',
  //   onPress: () => navigation?.navigate('ChangePassword'),
  // },
];

const ProfileScreen = ({navigation, route}) => {
  const {logout, user, isEkycVerified} = useAuth();
  const queryClient = useQueryClient();
  const refreshAccount = useAccountRefresh();
  const {data: accountRes} = useMyAccount({enabled: false});
  const {data: caregiverData, refetch: refetchCaregiver} = useCaregiverProfile();
  const {data: supportUnreadData} = useConversationUnreadCount();
  const supportUnread = unreadCountFromQuery(supportUnreadData);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(!accountRes?.data);
  const [status, setStatus] = useState({visible: false, type: 'success', title: '', message: ''});

  const showStatus = (type, title, message = '') =>
    setStatus({visible: true, type, title, message});

  const incomingSuccess = route?.params?.successMessage;
  useEffect(() => {
    if (incomingSuccess) {
      showStatus('success', incomingSuccess, 'Your latest details are now saved.');
      navigation?.setParams({successMessage: undefined});
    }
  }, [incomingSuccess, navigation]);

  const loadAll = useCallback(async () => {
    await Promise.allSettled([refreshAccount(), refetchCaregiver()]);
    setLoadingAccount(false);
  }, [refreshAccount, refetchCaregiver]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const account = accountRes?.data || user || {};
  const caregiver = caregiverData?.data || {};
  const needsCaregiverSetup = account.caregiver_profile_id === null;
  const photo = account.profile_photo || null;
  const displayName = account.name || 'Your profile';
  const rating = Number(caregiver.rating ?? caregiver.average_rating);
  const reviewCount = caregiver.total_reviews ?? caregiver.review_count;
  const isAvailable = caregiver.is_available !== false;

  const details = [
    {icon: 'call-outline', label: 'Phone', value: account.phone},
    {icon: 'mail-outline', label: 'Email', value: account.email},
    {icon: 'male-female-outline', label: 'Gender', value: genderLabel(account.gender)},
    {icon: 'calendar-outline', label: 'Date of birth', value: formatDob(account.date_of_birth)},
    {icon: 'location-outline', label: 'Address', value: account.address},
  ];

  const settings = [
    ...(needsCaregiverSetup
      ? [
          {
            id: 'setup',
            name: 'Complete caregiver profile',
            subtitle: 'Add your rate, area and experience',
            icon: 'alert-circle-outline',
            onPress: () => navigation?.navigate('CaregiverProfile', {mode: 'setup'}),
          },
        ]
      : []),
    {
      id: 'support',
      name: 'Support chat',
      subtitle: 'Message CareMate Support',
      icon: 'chatbubbles-outline',
      badge: supportUnread,
      onPress: () => navigation?.navigate('SupportChat'),
    },
    ...getSettings(navigation),
  ];

  const uploadPhoto = async asset => {
    const {file, error} = prepareProfilePhoto(asset);
    if (error) {
      showStatus('error', 'Photo not uploaded', error);
      return;
    }
    setUploading(true);
    try {
      await accountService.updatePhoto(file);
      await refreshAccount();
      queryClient.invalidateQueries({queryKey: queryKeys.caregiverProfile.all});
      showStatus('success', 'Profile photo updated', 'Families will see your new photo.');
    } catch (uploadError) {
      showStatus(
        'error',
        'Photo not uploaded',
        uploadError?.message || 'Could not update photo',
      );
    } finally {
      setUploading(false);
    }
  };

  const pickPhoto = async source => {
    setPhotoSheetOpen(false);
    const fromCamera = source === 'camera';
    const granted = fromCamera
      ? await requestCameraPermission()
      : await requestGalleryPermission();
    if (!granted) {
      showStatus(
        'error',
        'Permission required',
        fromCamera
          ? 'Please allow camera access to take a photo.'
          : 'Please allow photo library access to choose a photo.',
      );
      return;
    }
    const launch = fromCamera ? launchCamera : launchImageLibrary;
    const result = await launch(PROFILE_PHOTO_PICKER_OPTIONS);
    if (result?.didCancel) {
      return;
    }
    if (result?.errorCode) {
      showStatus('error', 'Could not open picker', result.errorMessage || '');
      return;
    }
    const asset = result?.assets?.[0];
    if (asset?.uri) {
      uploadPhoto(asset);
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="Profile" showBack={false} leftIcon="person-outline" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={TEAL}
            colors={[TEAL]}
          />
        }>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {photo ? (
              <Image source={{uri: photo}} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(account.name)}</Text>
              </View>
            )}
            {uploading ? (
              <View style={styles.avatarScrim}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.editBadge, uploading && styles.editBadgeDisabled]}
              onPress={() => setPhotoSheetOpen(true)}
              disabled={uploading}
              accessibilityLabel="Change profile photo"
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Icon name="camera" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {loadingAccount && !account.name ? 'Loading...' : displayName}
            </Text>

            <View style={styles.chipsRow}>
              <View style={[styles.chip, isEkycVerified ? styles.chipOk : styles.chipWarn]}>
                <Icon
                  name={isEkycVerified ? 'shield-checkmark' : 'shield-outline'}
                  size={12}
                  color={isEkycVerified ? TEAL : '#D97706'}
                />
                <Text
                  style={[
                    styles.chipText,
                    isEkycVerified ? styles.chipTextOk : styles.chipTextWarn,
                  ]}>
                  {isEkycVerified ? 'Verified' : 'Not verified'}
                </Text>
              </View>
              {!needsCaregiverSetup ? (
                <View style={[styles.chip, isAvailable ? styles.chipOk : styles.chipMuted]}>
                  <View style={[styles.dot, isAvailable ? styles.dotOn : styles.dotOff]} />
                  <Text
                    style={[
                      styles.chipText,
                      isAvailable ? styles.chipTextOk : styles.chipTextMuted,
                    ]}>
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
              ) : null}
              {Number.isFinite(rating) && rating > 0 ? (
                <View style={[styles.chip, styles.chipStar]}>
                  <Icon name="star" size={12} color="#F59E0B" />
                  <Text style={[styles.chipText, styles.chipTextStar]}>
                    {rating.toFixed(1)}
                    {reviewCount ? ` (${reviewCount})` : ''}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.editButton}
            onPress={() => navigation?.navigate('EditProfile')}
            accessibilityLabel="Edit profile"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon name="create-outline" size={20} color={TEAL} />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsCard}>
          {details.map((row, index) => (
            <View
              key={row.label}
              style={[styles.detailRow, index === details.length - 1 && styles.detailRowLast]}>
              <Icon name={row.icon} size={17} color={TEAL} />
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text
                style={[styles.detailValue, !row.value && styles.detailPlaceholder]}
                numberOfLines={2}>
                {row.value || 'Not set'}
              </Text>
            </View>
          ))}
        </View>

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
            {item.badge > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.badge > 99 ? '99+' : item.badge}
                </Text>
              </View>
            ) : null}
            <Icon name="chevron-forward" size={18} color="#C5CED6" />
          </TouchableOpacity>
        ))}

        <Text style={styles.version}>Nirapod Caregiver v1.0.0</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}>
          <Icon name="log-out-outline" size={18} color="#E74C3C" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={photoSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPhotoSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setPhotoSheetOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Profile photo</Text>
            <SheetOption icon="camera-outline" label="Take photo" onPress={() => pickPhoto('camera')} />
            <SheetOption
              icon="image-outline"
              label="Choose from gallery"
              onPress={() => pickPhoto('gallery')}
            />
            <Pressable onPress={() => setPhotoSheetOpen(false)} style={styles.sheetCancel}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <LogoutConfirmModal
        visible={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />

      <StatusModal
        visible={status.visible}
        type={status.type}
        title={status.title}
        message={status.message}
        onClose={() => setStatus(prev => ({...prev, visible: false}))}
      />
    </SafeAreaView>
  );
};

function SheetOption({icon, label, onPress}) {
  return (
    <Pressable onPress={onPress} style={styles.sheetRow}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={18} color={TEAL} />
      </View>
      <Text style={styles.sheetLabel}>{label}</Text>
    </Pressable>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: PAGE_BG},
  scrollContent: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32},
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F6F8F8',
    borderRadius: 18,
    padding: 14,
  },
  profileInfo: {flex: 1, minWidth: 0},
  avatarWrap: {width: AVATAR, height: AVATAR},
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: '#E8F3F1',
  },
  avatarText: {fontSize: 22, fontWeight: '800', color: '#FFFFFF'},
  avatarScrim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: AVATAR / 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editBadgeDisabled: {backgroundColor: '#9AA5B1'},
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15202B',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  chipOk: {backgroundColor: '#E8F3F1'},
  chipWarn: {backgroundColor: '#FFF4E5'},
  chipMuted: {backgroundColor: '#F0F2F5'},
  chipStar: {backgroundColor: '#FEF3C7'},
  chipText: {fontSize: 12, fontWeight: '700'},
  chipTextOk: {color: TEAL},
  chipTextWarn: {color: '#D97706'},
  chipTextMuted: {color: '#6B7785'},
  chipTextStar: {color: '#B45309'},
  dot: {width: 7, height: 7, borderRadius: 4},
  dotOn: {backgroundColor: '#22C55E'},
  dotOff: {backgroundColor: '#9AA5B1'},
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6E6E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    marginTop: 12,
    backgroundColor: '#F6F8F8',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E3E8EA',
  },
  detailRowLast: {borderBottomWidth: 0},
  detailLabel: {width: 96, fontSize: 13, color: '#8A97A6'},
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#15202B',
  },
  detailPlaceholder: {color: '#B4BEC8', fontWeight: '500'},
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {fontSize: 16, fontWeight: '600', color: '#15202B'},
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
  settingTitle: {fontSize: 14, fontWeight: '500', color: '#15202B'},
  settingSub: {marginTop: 2, fontSize: 12, color: '#8A97A6'},
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: '#E34242',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  badgeText: {color: '#FFFFFF', fontSize: 11, fontWeight: '700'},
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
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,27,33,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E1E6EA',
    marginBottom: 12,
  },
  sheetTitle: {fontSize: 16, fontWeight: '700', color: '#15202B', marginBottom: 8},
  sheetRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10},
  sheetLabel: {fontSize: 15, fontWeight: '600', color: '#15202B'},
  sheetCancel: {
    marginTop: 8,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F4F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {fontSize: 15, fontWeight: '700', color: '#15202B'},
});
