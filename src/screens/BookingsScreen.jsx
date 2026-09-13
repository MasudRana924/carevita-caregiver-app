import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useBookings} from '../api/queries';
import {useAcceptBooking, useRejectBooking} from '../api/mutations';
import BookingSkeleton from '../components/home/BookingSkeleton';
import Loader from '../components/common/Loader';

const TEAL = '#0B8A80';
const PAGE_BG = '#F4F8F7';

const FILTERS = [
  {key: '', label: 'All'},
  {key: 'PROVIDER_ASSIGNED', label: 'New'},
  {key: 'PROVIDER_ACCEPTED', label: 'Accepted'},
  {key: 'IN_PROGRESS', label: 'In progress'},
  {key: 'COMPLETED', label: 'Completed'},
];

const unwrapBookings = payload =>
  Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.bookings)
      ? payload.data.bookings
      : [];

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
    year: 'numeric',
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

const getServiceLabel = booking => {
  const raw = booking?.service_type || booking?.service || '';
  if (!raw) {
    return 'Caregiver Service';
  }
  const cleaned = String(raw).replace(/_/g, ' ').toLowerCase();
  return `${cleaned.replace(/\b\w/g, c => c.toUpperCase())} Service`;
};

const getStatusMeta = status => {
  switch (status) {
    case 'PROVIDER_ASSIGNED':
      return {label: 'Needs your response', color: '#E74C3C', icon: 'ellipse'};
    case 'PROVIDER_ACCEPTED':
    case 'CONFIRMED':
      return {label: 'Accepted', color: '#22C55E', icon: 'checkmark-circle'};
    case 'IN_PROGRESS':
      return {label: 'Assigned', color: '#3B82F6', icon: 'ellipse'};
    case 'COMPLETED':
      return {label: 'Completed', color: '#22C55E', icon: 'checkmark-circle'};
    case 'CANCELLED':
      return {label: 'Cancelled', color: '#E74C3C', icon: 'close-circle'};
    default:
      return {
        label: (status || 'Upcoming').replace(/_/g, ' '),
        color: '#F59E0B',
        icon: 'time',
      };
  }
};

const countByStatus = (list, key) => {
  if (!key) {
    return list.length;
  }
  return list.filter(item => item.status === key).length;
};

const BookingsScreen = ({navigation, route}) => {
  const initialStatus = route?.params?.status || '';
  const [status, setStatus] = useState(initialStatus);
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState('Not available that day');

  useEffect(() => {
    if (route?.params?.status !== undefined) {
      setStatus(route.params.status);
    }
  }, [route?.params?.status]);

  const {data: bookingsData, isLoading, refetch, isRefetching} = useBookings({
    limit: 50,
  });
  const acceptBooking = useAcceptBooking();
  const rejectBooking = useRejectBooking();

  const allBookings = unwrapBookings(bookingsData);
  const bookings = useMemo(() => {
    if (!status) {
      return allBookings;
    }
    return allBookings.filter(item => item.status === status);
  }, [allBookings, status]);

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

  const busy = acceptBooking.isPending || rejectBooking.isPending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Loader visible={busy} />

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSub}>
            Manage your recent and upcoming booking
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Icon name="calendar-outline" size={20} color={TEAL} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}>
        {FILTERS.map(filter => {
          const active = status === filter.key;
          const count = countByStatus(allBookings, filter.key);
          return (
            <TouchableOpacity
              key={filter.key || 'all'}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setStatus(filter.key)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {filter.label}
              </Text>
              <View style={[styles.count, active && styles.countActive]}>
                <Text
                  style={[
                    styles.countText,
                    active && styles.countTextActive,
                  ]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }>
        {isLoading ? (
          <BookingSkeleton />
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="calendar-outline" size={48} color="#C5D0D8" />
            <Text style={styles.emptyTitle}>No bookings</Text>
            <Text style={styles.emptyText}>
              Assigned bookings will show up here
            </Text>
          </View>
        ) : (
          bookings.map(booking => {
            const isNew = booking.status === 'PROVIDER_ASSIGNED';
            const statusMeta = getStatusMeta(booking.status);
            return (
              <View key={booking.id} style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() =>
                    navigation?.navigate('BookingDetails', {
                      bookingId: booking.id,
                    })
                  }>
                {isNew && (
                  <View style={styles.newTop}>
                    <Text style={styles.newLabel}>New Booking Request</Text>
                    <Text style={styles.bookingId}>
                      Booking #{booking.booking_number || booking.id?.slice(0, 8)}
                    </Text>
                  </View>
                )}

                <View style={styles.row}>
                  {getPhoto(booking) ? (
                    <Image source={{uri: getPhoto(booking)}} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Icon name="person" size={18} color={TEAL} />
                    </View>
                  )}

                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                      {getCustomerName(booking)}
                    </Text>
                    <View style={styles.metaLine}>
                      <Icon name="location-outline" size={13} color="#8A97A6" />
                      <Text style={styles.meta} numberOfLines={1}>
                        {getHospitalName(booking)}
                      </Text>
                    </View>
                    <View style={styles.metaLine}>
                      <Icon name="calendar-outline" size={13} color="#8A97A6" />
                      <Text style={styles.meta}>
                        {formatDate(booking.booking_date)}
                        {booking.start_time
                          ? ` · ${formatTime(booking.start_time)}`
                          : ''}
                      </Text>
                    </View>
                    <View style={styles.metaLine}>
                      <Icon name="medkit-outline" size={13} color="#8A97A6" />
                      <Text style={styles.meta}>{getServiceLabel(booking)}</Text>
                    </View>
                  </View>

                  <View style={styles.statusWrap}>
                    <Icon
                      name={statusMeta.icon}
                      size={14}
                      color={statusMeta.color}
                    />
                    <Text style={[styles.statusText, {color: statusMeta.color}]}>
                      {statusMeta.label}
                    </Text>
                  </View>
                </View>
                </TouchableOpacity>

                {isNew && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      activeOpacity={0.85}
                      onPress={() => handleAccept(booking.id)}>
                      <Icon name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.acceptText}>Accept Booking</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        setReason('Not available that day');
                        setRejectId(booking.id);
                      }}>
                      <Icon name="close" size={16} color="#E74C3C" />
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
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

export default BookingsScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: PAGE_BG},
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCopy: {flex: 1, paddingRight: 12},
  headerTitle: {fontSize: 22, fontWeight: '800', color: '#15202B'},
  headerSub: {marginTop: 4, fontSize: 13, color: '#8A97A6'},
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {paddingHorizontal: 16, paddingBottom: 10, gap: 8},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    marginRight: 8,
    gap: 6,
  },
  chipActive: {backgroundColor: TEAL},
  chipText: {fontSize: 13, fontWeight: '600', color: '#5E6B76'},
  chipTextActive: {color: '#FFFFFF'},
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEF2F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countActive: {backgroundColor: 'rgba(255,255,255,0.22)'},
  countText: {fontSize: 11, fontWeight: '700', color: '#5E6B76'},
  countTextActive: {color: '#FFFFFF'},
  scrollView: {flex: 1},
  scrollContent: {padding: 16, paddingTop: 6},
  emptyState: {alignItems: 'center', paddingVertical: 80},
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15202B',
    marginTop: 12,
  },
  emptyText: {fontSize: 14, color: '#8A97A6', marginTop: 6},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  newTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  newLabel: {fontSize: 12, fontWeight: '700', color: '#15202B'},
  bookingId: {fontSize: 11, color: '#8A97A6', fontWeight: '600'},
  row: {flexDirection: 'row', alignItems: 'flex-start'},
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
  info: {flex: 1, minWidth: 0, paddingRight: 8},
  name: {fontSize: 15, fontWeight: '800', color: '#15202B', marginBottom: 4},
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  meta: {flex: 1, fontSize: 12, color: '#8A97A6'},
  statusWrap: {
    alignItems: 'flex-end',
    maxWidth: 108,
    gap: 3,
  },
  statusText: {fontSize: 11, fontWeight: '700', textAlign: 'right'},
  actionRow: {flexDirection: 'row', gap: 10, marginTop: 14},
  acceptBtn: {
    flex: 1.15,
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
    flex: 0.85,
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
