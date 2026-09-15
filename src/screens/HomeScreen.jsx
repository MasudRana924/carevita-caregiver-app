import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeHeader from '../components/home/HomeHeader';
import Loader from '../components/common/Loader';
import {useAuth} from '../context/AuthContext';
import {
  useBookings,
  useCaregiverProfile,
  useInboxUnreadCount,
  useWallet,
} from '../api/queries';
import {
  useAcceptBooking,
  useRejectBooking,
  useUpdateCaregiverProfile,
} from '../api/mutations';

const TEAL = '#0B8A80';
const PAGE_BG = '#F4F8F7';

const unwrapBookings = payload =>
  Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.bookings)
      ? payload.data.bookings
      : [];

const formatAmount = value => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return '0.00';
  }
  return num.toFixed(2);
};

const formatDate = dateString => {
  if (!dateString) {
    return '--';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = timeString => {
  if (!timeString) {
    return '';
  }
  if (String(timeString).includes('T')) {
    const date = new Date(timeString);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }
  const [hours, minutes] = String(timeString).split(':');
  const hour = parseInt(hours, 10);
  if (Number.isNaN(hour)) {
    return String(timeString);
  }
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${(minutes || '00').slice(0, 2)} ${ampm}`;
};

const isSameDay = (value, compare = new Date()) => {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10) === compare.toISOString().slice(0, 10);
  }
  return (
    date.getFullYear() === compare.getFullYear() &&
    date.getMonth() === compare.getMonth() &&
    date.getDate() === compare.getDate()
  );
};

const getCustomerName = booking =>
  booking?.customer_name ||
  booking?.family_member_name ||
  booking?.family_member?.name ||
  booking?.user?.name ||
  'Family request';

const getHospitalName = booking =>
  booking?.hospital_name || booking?.hospital?.name || 'Location pending';

const getPhoto = booking =>
  booking?.family_member?.photo ||
  booking?.customer_photo ||
  booking?.user?.profile_photo ||
  null;

const getStatusMeta = status => {
  switch (status) {
    case 'PROVIDER_ACCEPTED':
    case 'CONFIRMED':
    case 'COMPLETED':
    case 'IN_PROGRESS':
      return {label: 'Accepted', bg: '#E6F7F2', text: '#0B8A80'};
    case 'PROVIDER_ASSIGNED':
      return {label: 'Assigned', bg: '#FFF4E5', text: '#E67E22'};
    case 'CANCELLED':
      return {label: 'Cancelled', bg: '#FEECEC', text: '#DC2626'};
    default:
      return {
        label: (status || 'Upcoming').replace(/_/g, ' '),
        bg: '#FFF4E5',
        text: '#E67E22',
      };
  }
};

const HomeScreen = ({navigation}) => {
  const {completeCaregiverProfile} = useAuth();
  const profileQuery = useCaregiverProfile();
  const assignedQuery = useBookings({status: 'PROVIDER_ASSIGNED', limit: 20});
  const allQuery = useBookings({limit: 20});
  const walletQuery = useWallet({limit: 5, offset: 0});
  const unreadQuery = useInboxUnreadCount();
  const updateProfile = useUpdateCaregiverProfile();
  const acceptBooking = useAcceptBooking();
  const rejectBooking = useRejectBooking();

  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState('Not available that day');

  const profile = profileQuery.data?.data || {};
  const assigned = unwrapBookings(assignedQuery.data);
  const allBookings = unwrapBookings(allQuery.data);
  const wallet = walletQuery.data?.data || {};
  const unread = unreadQuery.data?.unread ?? unreadQuery.data?.data?.unread ?? 0;
  const isAvailable = profile.is_available !== false;
  const featured = assigned[0];
  const todayBookings = useMemo(
    () =>
      allBookings.filter(
        item =>
          isSameDay(item.booking_date) &&
          item.status !== 'CANCELLED',
      ),
    [allBookings],
  );
  const recent = allBookings.slice(0, 4);

  const refreshing =
    profileQuery.isRefetching ||
    assignedQuery.isRefetching ||
    allQuery.isRefetching ||
    walletQuery.isRefetching;

  const busy =
    updateProfile.isPending ||
    acceptBooking.isPending ||
    rejectBooking.isPending;

  const onRefresh = () => {
    profileQuery.refetch();
    assignedQuery.refetch();
    allQuery.refetch();
    walletQuery.refetch();
    unreadQuery.refetch();
  };

  const toggleAvailability = async value => {
    try {
      const response = await updateProfile.mutateAsync({
        fields: {is_available: value},
      });
      if (response?.data) {
        completeCaregiverProfile(response.data);
      }
      profileQuery.refetch();
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const handleAccept = bookingId => {
    Alert.alert('Accept booking', 'Accept this booking request?', [
      {text: 'Not now', style: 'cancel'},
      {
        text: 'Accept',
        onPress: async () => {
          try {
            await acceptBooking.mutateAsync(bookingId);
          } catch (error) {
            Alert.alert('Error', error?.message || 'Failed to accept booking');
          }
        },
      },
    ]);
  };

  const submitReject = async () => {
    if (!rejectId || !reason.trim()) {
      Alert.alert('Required', 'Please enter a reason');
      return;
    }
    try {
      await rejectBooking.mutateAsync({
        id: rejectId,
        reason: reason.trim(),
      });
      setRejectId(null);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to reject booking');
    }
  };

  const openBooking = bookingId => {
    navigation.navigate('BookingDetails', {bookingId});
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Loader visible={busy} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <HomeHeader navigation={navigation} unreadCount={unread} />

        <View style={styles.availCard}>
          <View style={styles.availLeft}>
            {/* <View
              style={[
                styles.checkCircle,
                !isAvailable && styles.checkCircleOff,
              ]}>
              <Icon
                name={isAvailable ? 'checkmark' : 'close'}
                size={16}
                color="#FFFFFF"
              />
            </View> */}
            <View style={styles.availCopy}>
              <Text style={styles.availTitle}>
                {isAvailable ? "You're available" : "You're unavailable"}
              </Text>
              <Text style={styles.availSub}>
                {isAvailable
                  ? 'New booking requests can be assigned to you'
                  : 'Turn this on to receive new booking requests'}
              </Text>
            </View>
          </View>
          <View style={styles.availRight}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={updateProfile.isPending}
              onPress={() => toggleAvailability(!isAvailable)}
              style={[
                styles.toggleTrack,
                isAvailable ? styles.toggleTrackOn : styles.toggleTrackOff,
              ]}>
              <View
                style={[
                  styles.toggleKnob,
                  isAvailable ? styles.toggleKnobOn : styles.toggleKnobOff,
                ]}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.availState,
                {color: isAvailable ? '#22C55E' : '#8A97A6'},
              ]}>
              {isAvailable ? 'Available' : 'Offline'}
            </Text>
          </View>
        </View>


        <SectionHeader
          icon="flash"
          title="New Booking Request"
          onPress={() =>
            navigation.navigate('Bookings', {status: 'PROVIDER_ASSIGNED'})
          }
        />
        {featured ? (
          <View style={styles.requestCard}>
            <View style={styles.requestTop}>
              <View style={styles.requestBadge}>
                <Text style={styles.requestBadgeText}>NEW BOOKING REQUEST</Text>
              </View>
              {/* <Text style={styles.bookingNumber}>
                Booking #{featured.booking_number || featured.id?.slice(0, 8)}
              </Text> */}
            </View>

            <TouchableOpacity
              style={styles.personRow}
              activeOpacity={0.85}
              onPress={() => openBooking(featured.id)}>
              {getPhoto(featured) ? (
                <Image
                  source={{uri: getPhoto(featured)}}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Icon name="person" size={18} color={TEAL} />
                </View>
              )}
              <View style={styles.personCopy}>
                <Text style={styles.personName}>{getCustomerName(featured)}</Text>
                <Text style={styles.personMeta} numberOfLines={1}>
                  {getHospitalName(featured)}
                </Text>
                <View style={styles.metaLine}>
                  <Icon name="calendar-outline" size={13} color="#8A97A6" />
                  <Text style={styles.personMeta}>
                    {formatDate(featured.booking_date)}
                    {featured.start_time
                      ? ` · ${formatTime(featured.start_time)}`
                      : ''}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-forward" size={18} color="#27df0b" />
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.acceptBtn}
                activeOpacity={0.85}
                onPress={() => handleAccept(featured.id)}>
                <Icon name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.acceptText}>Accept Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setReason('Not available that day');
                  setRejectId(featured.id);
                }}>
                <Icon name="close" size={16} color="#E74C3C" />
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <EmptyCard text="No new booking requests right now" />
        )}

        <SectionHeader
          icon="calendar-outline"
          title="Today's Schedule"
          onPress={() => navigation.navigate('Bookings')}
        />
        <TouchableOpacity
          style={styles.scheduleCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Bookings')}>
          <View style={styles.scheduleIcon}>
            <Icon name="calendar" size={18} color={TEAL} />
          </View>
          <View style={styles.scheduleCopy}>
            <Text style={styles.scheduleTitle}>
              {todayBookings.length}{' '}
              {todayBookings.length === 1 ? 'Booking' : 'Bookings'}
            </Text>
            <Text style={styles.scheduleMeta}>
              Today, {formatDate(new Date().toISOString())}
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color="#B7C2CC" />
        </TouchableOpacity>

        <SectionHeader
          icon="time-outline"
          title="Recent Bookings"
          onPress={() => navigation.navigate('Bookings')}
        />
        {recent.length === 0 ? (
          <EmptyCard text="Recent bookings will appear here" />
        ) : (
          <View style={styles.recentCard}>
            {recent.map((booking, index) => {
              const status = getStatusMeta(booking.status);
              return (
                <TouchableOpacity
                  key={booking.id}
                  style={[
                    styles.recentRow,
                    index === recent.length - 1 && styles.recentRowLast,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => openBooking(booking.id)}>
                  {getPhoto(booking) ? (
                    <Image
                      source={{uri: getPhoto(booking)}}
                      style={styles.recentAvatar}
                    />
                  ) : (
                    <View style={styles.recentAvatarFallback}>
                      <Icon name="person" size={16} color={TEAL} />
                    </View>
                  )}
                  <View style={styles.recentCopy}>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {getCustomerName(booking)}
                    </Text>
                    <Text style={styles.recentMeta} numberOfLines={1}>
                      {getHospitalName(booking)}
                    </Text>
                    <View style={styles.metaLine}>
                      <Icon name="time-outline" size={12} color="#8A97A6" />
                      <Text style={styles.recentMeta}>
                        {formatDate(booking.booking_date)}
                        {booking.start_time
                          ? ` · ${formatTime(booking.start_time)}`
                          : ''}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[styles.statusChip, {backgroundColor: status.bg}]}>
                    <Text style={[styles.statusText, {color: status.text}]}>
                      {status.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!rejectId}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject booking</Text>
            <TextInput
              style={styles.reasonInput}
              value={reason}
              onChangeText={setReason}
              placeholder="Reason"
              placeholderTextColor="#8A97A6"
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalGhost}
                onPress={() => setRejectId(null)}>
                <Text style={styles.modalGhostText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimary} onPress={submitReject}>
                <Text style={styles.acceptText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const SectionHeader = ({icon, title, onPress}) => (
  <View style={styles.sectionHead}>
    <View style={styles.sectionTitleRow}>

      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <TouchableOpacity onPress={onPress} hitSlop={8}>
      <Text style={styles.viewAll}>View all </Text>
    </TouchableOpacity>
  </View>
);

const StatCard = ({icon, value, label, onPress}) => (
  <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={onPress}>
    <View style={styles.statTop}>
      <Icon name={icon} size={16} color="#07d84d" />
      <Icon name="chevron-forward" size={18} color="#07d84d" />
    </View>
    <Text style={styles.statValue} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const EmptyCard = ({text}) => (
  <View style={styles.emptyCard}>
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: PAGE_BG},
  scrollContent: {paddingHorizontal: 16, paddingBottom: 32},
  availCard: {
    marginTop: 16,
    backgroundColor: '#EAF7F4',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availLeft: {flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 10},
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkCircleOff: {backgroundColor: '#A0AEC0'},
  availCopy: {flex: 1},
  availTitle: {fontSize: 15, fontWeight: '800', color: '#15202B'},
  availSub: {marginTop: 3, fontSize: 12, lineHeight: 16, color: '#6F7F8C'},
  availRight: {alignItems: 'center', minWidth: 64},
  toggleTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackOn: {backgroundColor: '#22C55E'},
  toggleTrackOff: {backgroundColor: '#D5DEE6'},
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0B1F2A',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 2,
  },
  toggleKnobOn: {alignSelf: 'flex-end'},
  toggleKnobOff: {alignSelf: 'flex-start'},
  availState: {marginTop: 6, fontSize: 11, fontWeight: '700'},
  statsRow: {flexDirection: 'row', gap: 10, marginTop: 14},
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    minHeight: 108,
    width: 308,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '800',
    color: '#15202B',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: '#8A97A6',
  },
  sectionHead: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  sectionTitle: {fontSize: 15, fontWeight: '400', color: '#15202B'},
  viewAll: {fontSize: 12, fontWeight: '600', color: TEAL},
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,

  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requestBadge: {
    backgroundColor: '#EAF4FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  requestBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2B6CB0',
    letterSpacing: 0.3,
  },
  bookingNumber: {fontSize: 11, color: '#8A97A6', fontWeight: '600'},
  personRow: {flexDirection: 'row', alignItems: 'center'},
  avatar: {width: 42, height: 42, borderRadius: 21, marginRight: 10},
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    backgroundColor: '#E8F3F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personCopy: {flex: 1, minWidth: 0},
  personName: {fontSize: 15, fontWeight: '800', color: '#15202B'},
  personMeta: {marginTop: 2, fontSize: 12, color: '#8A97A6'},
  metaLine: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3},
  actionRow: {flexDirection: 'row', gap: 10, marginTop: 14},
  acceptBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 22,
    backgroundColor: TEAL,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptText: {fontSize: 13, fontWeight: '700', color: '#FFFFFF'},
  rejectBtn: {
    flex: 0.9,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#F0B4B0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rejectText: {fontSize: 13, fontWeight: '700', color: '#E74C3C'},
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F3F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scheduleCopy: {flex: 1},
  scheduleTitle: {fontSize: 15, fontWeight: '800', color: '#15202B'},
  scheduleMeta: {marginTop: 2, fontSize: 12, color: '#8A97A6'},
  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F5',
  },
  recentRowLast: {borderBottomWidth: 0},
  recentAvatar: {width: 38, height: 38, borderRadius: 19, marginRight: 10},
  recentAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#E8F3F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentCopy: {flex: 1, minWidth: 0, marginRight: 8},
  recentName: {fontSize: 14, fontWeight: '700', color: '#15202B'},
  recentMeta: {fontSize: 11, color: '#8A97A6'},
  statusChip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {fontSize: 10, fontWeight: '800', textTransform: 'capitalize'},
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center',
  },
  emptyText: {fontSize: 13, color: '#8A97A6'},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18},
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#15202B',
    marginBottom: 12,
  },
  reasonInput: {
    minHeight: 90,
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    padding: 12,
    textAlignVertical: 'top',
    color: '#15202B',
  },
  modalActions: {flexDirection: 'row', gap: 10, marginTop: 16},
  modalGhost: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F6F6',
  },
  modalGhostText: {fontSize: 15, fontWeight: '600', color: '#15202B'},
  modalPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL,
  },
});
