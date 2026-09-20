import React, {useEffect, useMemo, useRef, useState} from 'react';
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
  AppState,
  DeviceEventEmitter,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
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
import {
  findReminderBooking,
  formatCountdown,
  filterActiveBookings,
  getOfferRemainingMs,
  isOfferExpired,
} from '../utils/bookingTime';
import {
  REVIEW_RECEIVED_EVENT,
  getPendingReview,
  clearPendingReview,
} from '../utils/homeAlerts';
import {unwrapList, getAcceptConflictMessage} from '../api/envelope';
import Toast from '../components/common/Toast';
import OfferCountdown from '../components/booking/OfferCountdown';

const TEAL = '#0B8A80';
const PAGE_BG = '#FFFFFF';

const unwrapBookings = payload => unwrapList(payload);

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
      return {label: 'Waiting for pay', bg: '#E6F7F2', text: '#0B8A80'};
    case 'PAYMENT_PAID':
      return {label: 'Paid', bg: '#E6F7F2', text: '#0B8A80'};
    case 'IN_PROGRESS':
    case 'SERVICE_IN_PROGRESS':
      return {label: 'In progress', bg: '#E6F7F2', text: '#0B8A80'};
    case 'COMPLETED':
    case 'SERVICE_COMPLETED':
      return {label: 'Completed', bg: '#E6F7F2', text: '#0B8A80'};
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
  const [nowTs, setNowTs] = useState(Date.now);
  const [reviewAlert, setReviewAlert] = useState(null);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'error',
  });
  const expiredIdsRef = useRef(new Set());

  const profile = profileQuery.data?.data || {};
  const assignedRaw = unwrapBookings(assignedQuery.data);
  const assigned = useMemo(
    () => filterActiveBookings(assignedRaw, nowTs),
    [assignedRaw, nowTs],
  );
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
  const reminder = useMemo(
    () => findReminderBooking(allBookings, nowTs),
    [allBookings, nowTs],
  );
  const recent = allBookings.slice(0, 4);

  useEffect(() => {
    const tick = () => setNowTs(Date.now());
    const interval = setInterval(tick, 1000);
    const appSub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        tick();
      }
    });
    return () => {
      clearInterval(interval);
      appSub.remove();
    };
  }, []);

  useEffect(() => {
    let expiredNow = false;
    assignedRaw.forEach(booking => {
      if (booking?.status !== 'PROVIDER_ASSIGNED' || !booking?.id) {
        return;
      }
      const remaining = getOfferRemainingMs(booking, nowTs);
      if (remaining == null || remaining > 0) {
        return;
      }
      if (!expiredIdsRef.current.has(booking.id)) {
        expiredIdsRef.current.add(booking.id);
        expiredNow = true;
      }
    });
    if (expiredNow) {
      setToast({
        visible: true,
        message: 'Offer expired / reassigned',
        type: 'error',
      });
      assignedQuery.refetch();
      allQuery.refetch();
    }
  }, [assignedRaw, nowTs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true;
    const loadReview = async () => {
      const pending = await getPendingReview();
      if (mounted && pending) {
        setReviewAlert(pending);
      }
    };
    loadReview();
    const eventSub = DeviceEventEmitter.addListener(
      REVIEW_RECEIVED_EVENT,
      payload => {
        setReviewAlert(payload);
      },
    );
    const focusSub = navigation.addListener('focus', loadReview);
    return () => {
      mounted = false;
      eventSub.remove();
      focusSub();
    };
  }, [navigation]);

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

  const handleAccept = (bookingId, booking) => {
    if (isOfferExpired(booking, nowTs)) {
      setToast({
        visible: true,
        message: 'Offer expired / reassigned',
        type: 'error',
      });
      assignedQuery.refetch();
      return;
    }
    Alert.alert('Accept booking', 'Accept this booking request?', [
      {text: 'Not now', style: 'cancel'},
      {
        text: 'Accept',
        onPress: async () => {
          try {
            await acceptBooking.mutateAsync(bookingId);
          } catch (error) {
            Alert.alert('Cannot accept', getAcceptConflictMessage(error));
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
    const match =
      assigned.find(item => item.id === bookingId) ||
      allBookings.find(item => item.id === bookingId);
    navigation.navigate('BookingDetails', {
      bookingId,
      offerExpiresAt: match?.offer_expires_at,
    });
  };

  const dismissReview = async () => {
    setReviewAlert(null);
    await clearPendingReview();
  };

  const openReviewBooking = async () => {
    const bookingId = reviewAlert?.booking_id || reviewAlert?.bookingId;
    await dismissReview();
    if (bookingId) {
      openBooking(bookingId);
    }
  };

  const reminderRemaining = reminder?.remaining ?? 0;
  const reminderReady = reminderRemaining <= 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Loader visible={busy} overlay />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({...prev, visible: false}))}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <HomeHeader navigation={navigation} unreadCount={unread} />

        <View style={styles.availCard}>
          <View style={styles.availIcon}>
            <Icon name="calendar-outline" size={20} color="#0B8A80" />
          </View>
          <View style={styles.availCopy}>
            <Text style={styles.availTitle}>
              {isAvailable ? "You're available" : "You're offline"}
            </Text>
            <Text style={styles.availSub}>
              {isAvailable
                ? 'Families can send you new booking requests'
                : 'Turn on to receive new booking requests'}
            </Text>
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
            {/* <Text
              style={[
                styles.availState,
                {color: isAvailable ? '#22C55E' : '#8A97A6'},
              ]}>
              {isAvailable ? 'On' : 'Off'}
            </Text> */}
          </View>
        </View>


        {reminder?.booking ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => openBooking(reminder.booking.id)}>
            <LinearGradient
              colors={['#EEFBF7', '#E3F6F0']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.timerCard}>
              <View style={styles.timerBlob} />
              <View style={styles.timerBlobSmall} />
              <View style={styles.timerTop}>
                <View style={styles.timerCopy}>
                  <View style={styles.timerBadge}>
                    <Icon name="time-outline" size={14} color={TEAL} />
                    <Text style={styles.timerBadgeText}>
                      {reminderReady ? 'Ready to start' : 'Service starts in'}
                    </Text>
                  </View>
                  <Text style={styles.timerClock}>
                    {reminderReady
                      ? '00:00:00'
                      : formatCountdown(reminderRemaining)}
                  </Text>
                </View>
                <ServiceClockArt />
              </View>
              <View style={styles.timerPerson}>
                <View style={styles.timerPlaceIcon}>
                  <Icon name="business-outline" size={16} color={TEAL} />
                </View>
                <View style={styles.timerPersonCopy}>
                  <Text style={styles.timerTitle} numberOfLines={1}>
                    {getCustomerName(reminder.booking)}
                  </Text>
                  <Text style={styles.timerMeta} numberOfLines={1}>
                    {getHospitalName(reminder.booking)}
                    {reminder.booking.start_time
                      ? ` · ${formatTime(reminder.booking.start_time)}`
                      : ''}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}

        <SectionHeader
          title="Needs your reply"
          icon="mail-outline"
          iconBg="#FFE8EE"
          iconColor="#E83E6B"
          actionLabel="View all"
          onPress={() =>
            navigation.navigate('Bookings', {status: 'PROVIDER_ASSIGNED'})
          }
        />
        {featured ? (
          <View style={styles.requestCard}>
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
                <OfferCountdown
                  booking={featured}
                  nowTs={nowTs}
                  style={styles.offerCountdown}
                />
              </View>
              <Icon name="chevron-forward" size={18} color="#B7C2CC" />
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.acceptBtn,
                  isOfferExpired(featured, nowTs) && styles.actionDisabled,
                ]}
                activeOpacity={0.85}
                disabled={isOfferExpired(featured, nowTs)}
                onPress={() => handleAccept(featured.id, featured)}>
                <Icon name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rejectBtn,
                  isOfferExpired(featured, nowTs) && styles.actionDisabled,
                ]}
                activeOpacity={0.85}
                disabled={isOfferExpired(featured, nowTs)}
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
          <EmptyCard
            tone="pink"
            icon="mail-outline"
            title="No requests waiting"
            text={
              isAvailable
                ? 'Stay online. New family requests will show up here.'
                : 'Turn availability On above to get new requests.'
            }
          />
        )}

        <SectionHeader
          title="Today's work"
          icon="calendar-outline"
          iconBg="#DDF5EF"
          iconColor="#0B8A80"
          actionLabel="Open bookings"
          onPress={() => navigation.navigate('Bookings')}
        />
        <TouchableOpacity
          style={styles.scheduleCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Bookings')}>
          <View style={styles.scheduleIcon}>
            <Icon
              name={todayBookings.length ? 'calendar-outline' : 'sunny-outline'}
              size={20}
              color="#0B8A80"
            />
          </View>
          <View style={styles.scheduleCopy}>
            <Text style={styles.scheduleTitle}>
              {todayBookings.length === 0
                ? 'No visits today'
                : `${todayBookings.length} visit${
                    todayBookings.length === 1 ? '' : 's'
                  } today`}
            </Text>
            <Text style={styles.scheduleMeta}>
              {todayBookings.length === 0
                ? 'Nothing scheduled · enjoy your free time'
                : `Today, ${formatDate(new Date().toISOString())} · tap to open`}
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color="#B7C2CC" />
        </TouchableOpacity>

        <SectionHeader
          title="Recent activity"
          icon="time-outline"
          iconBg="#E4F0FF"
          iconColor="#3B82F6"
          actionLabel="View all"
          onPress={() => navigation.navigate('Bookings')}
        />
        {recent.length === 0 ? (
          <EmptyCard
            tone="blue"
            icon="calendar-outline"
            title="No bookings yet"
            text="When you get a booking, it will appear here."
          />
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
        visible={!!reviewAlert}
        transparent
        animationType="fade"
        onRequestClose={dismissReview}>
        <View style={styles.ratingBackdrop}>
          <View style={styles.ratingCard}>
            <View style={styles.ratingIconWrap}>
              <Icon name="star" size={28} color="#F5B400" />
            </View>
            <Text style={styles.ratingEyebrow}>New rating received</Text>
            <Text style={styles.ratingTitle}>
              You received {reviewAlert?.rating || 5} stars
            </Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <Icon
                  key={star}
                  name={star <= (reviewAlert?.rating || 5) ? 'star' : 'star-outline'}
                  size={28}
                  color="#F5B400"
                />
              ))}
            </View>
            <Text style={styles.ratingBody}>
              {reviewAlert?.body ||
                `You received ${reviewAlert?.rating || 5} stars for booking ${
                  reviewAlert?.booking_number || 'this visit'
                }.`}
            </Text>
            <TouchableOpacity
              style={styles.ratingPrimary}
              activeOpacity={0.85}
              onPress={openReviewBooking}>
              <Text style={styles.ratingPrimaryText}>View booking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ratingGhost}
              activeOpacity={0.8}
              onPress={dismissReview}>
              <Text style={styles.ratingGhostText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

const ServiceClockArt = () => (
  <View style={styles.clockArt}>
    <View style={styles.clockHalo} />
    <View style={styles.clockOuter}>
      <View style={styles.clockInner}>
        <View style={[styles.tickV, {top: 6}]} />
        <View style={[styles.tickV, {bottom: 6}]} />
        <View style={[styles.tickH, {left: 6}]} />
        <View style={[styles.tickH, {right: 6}]} />
        <View style={[styles.handWrap, {transform: [{rotate: '-48deg'}]}]}>
          <View style={styles.hourHand} />
        </View>
        <View style={[styles.handWrap, {transform: [{rotate: '38deg'}]}]}>
          <View style={styles.minuteHand} />
        </View>
        <View style={styles.clockDot} />
      </View>
    </View>
    <View style={styles.sparkle}>
      <View style={styles.sparkleV} />
      <View style={styles.sparkleH} />
    </View>
  </View>
);

const SectionHeader = ({
  title,
  icon,
  iconBg,
  iconColor,
  actionLabel,
  onPress,
}) => (
  <View style={styles.sectionHead}>
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionIcon, {backgroundColor: iconBg}]}>
        <Icon name={icon} size={15} color={iconColor} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {actionLabel ? (
      <TouchableOpacity
        style={styles.viewAllBtn}
        onPress={onPress}
        hitSlop={8}
        activeOpacity={0.8}>
        <Text style={styles.viewAll}>{actionLabel}</Text>
        <Icon name="chevron-forward" size={14} color={TEAL} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const EmptyCard = ({icon, title, text, tone = 'green'}) => {
  const tones = {
    pink: {
      card: '#FFF5F7',
      iconWrap: '#FFE4EB',
      icon: '#E83E6B',
    },
    blue: {
      card: '#F0F6FF',
      iconWrap: '#DBEAFE',
      icon: '#3B82F6',
    },
    green: {
      card: '#F2FAF7',
      iconWrap: '#DDF5EF',
      icon: '#0B8A80',
    },
  };
  const palette = tones[tone] || tones.green;

  return (
    <View style={[styles.emptyCard, {backgroundColor: palette.card}]}>
      <View style={[styles.emptyIcon, {backgroundColor: palette.iconWrap}]}>
        <Icon
          name={icon || 'information-circle-outline'}
          size={26}
          color={palette.icon}
        />
        {tone === 'pink' ? <View style={styles.emptyBadgeDot} /> : null}
      </View>
      {!!title && <Text style={styles.emptyTitle}>{title}</Text>}
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: PAGE_BG},
  scrollContent: {paddingHorizontal: 16, paddingBottom: 32},
  availCard: {
    marginTop: 18,
    backgroundColor: '#EAF8F4',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  availIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4F0E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  availCopy: {flex: 1, marginRight: 10},
  availTitle: {fontSize: 15, fontWeight: '800', color: '#15202B'},
  availSub: {marginTop: 3, fontSize: 10, lineHeight: 17, color: '#6F7F8C'},
  availRight: {alignItems: 'center', minWidth: 52},
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
  timerCard: {
    marginTop: 16,
    borderRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  timerBlob: {
    position: 'absolute',
    right: -36,
    bottom: -48,
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(125, 217, 200, 0.28)',
  },
  timerBlobSmall: {
    position: 'absolute',
    right: 18,
    top: 8,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(167, 230, 214, 0.35)',
  },
  timerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timerCopy: {flex: 1, paddingRight: 8},
  timerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 30,
    shadowColor: '#0B8A80',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 1,
  },
  timerBadgeText: {fontSize: 12, fontWeight: '700', color: TEAL},
  timerClock: {
    marginTop: 10,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    color: '#0B3D32',
    letterSpacing: 0.6,
    fontVariant: ['tabular-nums'],
  },
  clockArt: {
    width: 88,
    height: 88,
    marginTop: -4,
    marginRight: -4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockHalo: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(167, 230, 214, 0.55)',
  },
  clockOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#63D1BA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B8A80',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 3,
  },
  clockInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E9FBF6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tickV: {
    position: 'absolute',
    width: 2,
    height: 6,
    borderRadius: 1,
    backgroundColor: '#7BCDBB',
    alignSelf: 'center',
  },
  tickH: {
    position: 'absolute',
    width: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#7BCDBB',
    top: 24,
  },
  handWrap: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
  },
  hourHand: {
    width: 3,
    height: 14,
    marginTop: 12,
    borderRadius: 2,
    backgroundColor: '#0E6B5C',
  },
  minuteHand: {
    width: 2.5,
    height: 18,
    marginTop: 8,
    borderRadius: 2,
    backgroundColor: '#0E6B5C',
  },
  clockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0E6B5C',
    zIndex: 2,
  },
  sparkle: {
    position: 'absolute',
    top: 6,
    right: 4,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleV: {
    position: 'absolute',
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#7ED9C8',
  },
  sparkleH: {
    position: 'absolute',
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#7ED9C8',
  },
  timerPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timerPlaceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  timerPersonCopy: {flex: 1, minWidth: 0},
  timerTitle: {fontSize: 15, fontWeight: '800', color: '#15202B'},
  timerMeta: {marginTop: 2, fontSize: 12, color: '#7A8B9A'},
  timerHint: {fontSize: 12, lineHeight: 18, color: '#8A97A6'},
  ratingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 42, 36, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  ratingCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 18,
    alignItems: 'center',
  },
  ratingIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF6D9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  ratingEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: TEAL,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ratingTitle: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '800',
    color: '#0E2A24',
    textAlign: 'center',
  },
  starRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    marginBottom: 12,
  },
  ratingBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6F7F8C',
    textAlign: 'center',
    marginBottom: 20,
  },
  ratingPrimary: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPrimaryText: {fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
  ratingGhost: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ratingGhostText: {fontSize: 14, fontWeight: '600', color: '#8A97A6'},
  statsRow: {flexDirection: 'row', gap: 10, marginTop: 14},
  snapshotRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  snapshotIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E8F3F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  snapshotValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15202B',
  },
  snapshotLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#5B6B7A',
  },
  snapshotHint: {
    marginTop: 2,
    fontSize: 10,
    color: '#8A97A6',
  },
  sectionHead: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1},
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {fontSize: 14, fontWeight: '400', color: '#15202B'},
  viewAllBtn: {flexDirection: 'row', alignItems: 'center', gap: 2},
  viewAll: {fontSize: 13, fontWeight: '600', color: TEAL},
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F3F5',
  },
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
  offerCountdown: {marginTop: 8},
  actionRow: {flexDirection: 'row', gap: 10, marginTop: 14},
  actionDisabled: {opacity: 0.45},
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
    backgroundColor: '#EAF8F4',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4F0E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scheduleCopy: {flex: 1},
  scheduleTitle: {fontSize: 15, fontWeight: '600', color: '#15202B'},
  scheduleMeta: {marginTop: 3, fontSize: 12, lineHeight: 17, color: '#6F7F8C'},
  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F0F3F5',
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
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  emptyBadgeDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E34242',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#15202B',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#8A97A6',
    textAlign: 'center',
  },
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
