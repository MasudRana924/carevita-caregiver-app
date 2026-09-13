import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useBookingDetails} from '../api/queries';
import {
  useAcceptBooking,
  useRejectBooking,
  useCancelBooking,
} from '../api/mutations';
import Header from '../components/common/Header';
import BookingDetailsSkeleton from '../components/home/BookingDetailsSkeleton';
import Loader from '../components/common/Loader';

const STATUS_STYLES = {
  PENDING_PAYMENT: {bg: '#FFF4E5', text: '#D97706'},
  PROVIDER_ASSIGNED: {bg: '#E6F4F3', text: '#008178'},
  PROVIDER_ACCEPTED: {bg: '#E6F4F3', text: '#008178'},
  CONFIRMED: {bg: '#E6F4F3', text: '#008178'},
  IN_PROGRESS: {bg: '#E6F4F3', text: '#008178'},
  COMPLETED: {bg: '#E6F4F3', text: '#008178'},
  CANCELLED: {bg: '#FEECEC', text: '#DC2626'},
};

const BookingDetailsScreen = ({navigation, route}) => {
  const {bookingId} = route.params || {};
  const {data: bookingData, isLoading, refetch} = useBookingDetails(bookingId);
  const acceptBooking = useAcceptBooking();
  const rejectBooking = useRejectBooking();
  const cancelBooking = useCancelBooking();
  const booking = bookingData?.data;
  const [reasonModal, setReasonModal] = useState(null);
  const [reason, setReason] = useState('');

  const formatDate = dateString => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '--';
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return '--';
    }
  };

  const formatTime = timeString => {
    if (!timeString) return '--';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      return '--';
    }
  };

  const statusStyle =
    STATUS_STYLES[booking?.status] || {bg: '#F0F2F5', text: '#8190A7'};
  const statusLabel = (booking?.status || '').replace(/_/g, ' ');
  const canRespond = booking?.status === 'PROVIDER_ASSIGNED';
  const canCancel =
    booking?.status &&
    !['CANCELLED', 'COMPLETED'].includes(booking.status) &&
    !canRespond;
  const paymentReceived =
    booking?.payment_status === 'PAID' &&
    !['CANCELLED', 'COMPLETED'].includes(booking?.status);

  const familyName =
    booking?.family_member_name || booking?.family_member?.name;
  const customerName = booking?.customer_name || booking?.user?.name;
  const familyMeta = [
    booking?.family_member?.relationship,
    booking?.family_member?.blood_group,
  ]
    .filter(Boolean)
    .join(' · ');
  const familyAddress = [
    booking?.family_member_house,
    booking?.family_member_thana,
    booking?.family_member_district,
  ]
    .filter(Boolean)
    .join(', ');
  const hospitalName = booking?.hospital_name || booking?.hospital?.name;

  const handleAccept = () => {
    Alert.alert('Accept booking', 'Accept this booking request?', [
      {text: 'Not now', style: 'cancel'},
      {
        text: 'Accept',
        onPress: async () => {
          try {
            await acceptBooking.mutateAsync(bookingId);
            Alert.alert('Accepted', 'Booking accepted. The family will be notified.');
            refetch();
          } catch (error) {
            Alert.alert('Error', error?.message || 'Failed to accept booking');
          }
        },
      },
    ]);
  };

  const submitReason = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a reason');
      return;
    }
    try {
      if (reasonModal === 'reject') {
        await rejectBooking.mutateAsync({id: bookingId, reason: trimmed});
        Alert.alert('Rejected', 'Booking was rejected');
      } else {
        await cancelBooking.mutateAsync({id: bookingId, reason: trimmed});
        Alert.alert('Cancelled', 'Booking cancelled');
      }
      setReasonModal(null);
      setReason('');
      refetch();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Action failed');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <Header title="Booking details" onBack={() => navigation?.goBack()} />
        <BookingDetailsSkeleton />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <Header title="Booking details" onBack={() => navigation?.goBack()} />
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Icon name="alert-circle-outline" size={32} color="#008178" />
          </View>
          <Text style={styles.errorTitle}>Booking not found</Text>
          <Text style={styles.errorText}>
            This booking may have been removed or is unavailable
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const infoRows = [
    {label: 'Booking number', value: booking.booking_number},
    {label: 'Status', value: statusLabel},
    {label: 'Date', value: formatDate(booking.booking_date)},
    {
      label: 'Time',
      value: `${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}`,
    },
    {label: 'Duration', value: booking.duration_hours ? `${booking.duration_hours} hours` : '--'},
    {
      label: 'Service',
      value: (booking.service_type || '').replace(/_/g, ' '),
    },
    {
      label: 'Payment',
      value: (booking.payment_status || '').replace(/_/g, ' '),
    },
  ];

  const busy =
    acceptBooking.isPending ||
    rejectBooking.isPending ||
    cancelBooking.isPending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={busy} />
      <Header title="Booking details" onBack={() => navigation?.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {paymentReceived && (
          <View style={styles.startBanner}>
            <Icon name="checkmark-circle" size={22} color="#008178" />
            <View style={styles.startBannerText}>
              <Text style={styles.startTitle}>Payment received</Text>
              <Text style={styles.startSub}>
                The family paid. You can start this booking now.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>Total amount</Text>
              <Text style={styles.heroAmount}>৳{booking.total_amount}</Text>
            </View>
            <View style={[styles.statusBadge, {backgroundColor: statusStyle.bg}]}>
              <Text style={[styles.statusText, {color: statusStyle.text}]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          {infoRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.infoRow,
                index === infoRows.length - 1 && styles.infoRowLast,
              ]}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {row.value || '--'}
              </Text>
            </View>
          ))}
        </View>

        {!!customerName && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <Text style={styles.personName}>{customerName}</Text>
          </View>
        )}

        {!!familyName && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Patient</Text>
            <View style={styles.personRow}>
              {booking.family_member?.photo ? (
                <Image
                  source={{uri: booking.family_member.photo}}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="person" size={22} color="#008178" />
                </View>
              )}
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{familyName}</Text>
                {!!familyMeta && (
                  <Text style={styles.personMeta}>{familyMeta}</Text>
                )}
                {!!familyAddress && (
                  <Text style={styles.personMeta}>{familyAddress}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {!!hospitalName && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Hospital</Text>
            <View style={styles.personRow}>
              {booking.hospital?.photo ? (
                <Image
                  source={{uri: booking.hospital.photo}}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="business" size={22} color="#008178" />
                </View>
              )}
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{hospitalName}</Text>
                {!!booking.hospital?.address && (
                  <Text style={styles.personMeta} numberOfLines={2}>
                    {booking.hospital.address}
                  </Text>
                )}
                {!!booking.hospital?.phone && (
                  <Text style={styles.personMeta}>{booking.hospital.phone}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {!!booking.patient_requirements && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Patient needs</Text>
            <Text style={styles.bodyText}>{booking.patient_requirements}</Text>
          </View>
        )}

        {!!booking.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.bodyText}>{booking.notes}</Text>
          </View>
        )}

        {Array.isArray(booking.history) && booking.history.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>History</Text>
            {booking.history.map((item, index) => (
              <Text key={`${item.new_status}-${index}`} style={styles.bodyText}>
                {(item.old_status || '—').replace(/_/g, ' ')} →{' '}
                {(item.new_status || '—').replace(/_/g, ' ')}
                {item.note ? ` · ${item.note}` : ''}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      {(canRespond || canCancel) && (
        <View style={styles.bottomContainer}>
          {canRespond && (
            <>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setReason('Not available that day');
                  setReasonModal('reject');
                }}>
                <Text style={[styles.payButtonText, styles.cancelButtonText]}>
                  Reject
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.actionButton, styles.payButton]}
                onPress={handleAccept}>
                <Text style={styles.payButtonText}>Accept</Text>
              </TouchableOpacity>
            </>
          )}
          {canCancel && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setReason('Emergency');
                setReasonModal('cancel');
              }}>
              <Text style={[styles.payButtonText, styles.cancelButtonText]}>
                Cancel booking
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal
        visible={!!reasonModal}
        transparent
        animationType="fade"
        onRequestClose={() => setReasonModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {reasonModal === 'reject' ? 'Reject booking' : 'Cancel booking'}
            </Text>
            <TextInput
              style={styles.reasonInput}
              value={reason}
              onChangeText={setReason}
              placeholder="Reason"
              placeholderTextColor="#8190A7"
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalGhost}
                onPress={() => setReasonModal(null)}>
                <Text style={styles.modalGhostText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimary} onPress={submitReason}>
                <Text style={styles.payButtonText}>
                  {reasonModal === 'reject' ? 'Reject' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BookingDetailsScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  scrollView: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingBottom: 24},
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: '#8190A7',
    textAlign: 'center',
    lineHeight: 20,
  },
  startBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F3',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  startBannerText: {flex: 1},
  startTitle: {fontSize: 15, fontWeight: '700', color: '#008178'},
  startSub: {marginTop: 3, fontSize: 13, color: '#4A5568'},
  heroCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroLeft: {flex: 1, paddingRight: 12},
  heroLabel: {fontSize: 12, color: '#8190A7', marginBottom: 4},
  heroAmount: {fontSize: 28, fontWeight: '700', color: '#111820'},
  statusBadge: {paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20},
  statusText: {fontSize: 12, fontWeight: '600', textTransform: 'capitalize'},
  heroDivider: {height: 1, backgroundColor: '#EAEAEA', marginBottom: 10},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  infoRowLast: {paddingBottom: 0},
  infoLabel: {fontSize: 13, color: '#8190A7'},
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#111820',
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 12,
  },
  personRow: {flexDirection: 'row', alignItems: 'center'},
  avatar: {width: 52, height: 52, borderRadius: 26, marginRight: 12},
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personInfo: {flex: 1, minWidth: 0},
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 3,
  },
  personMeta: {fontSize: 13, color: '#8190A7', lineHeight: 18},
  bodyText: {marginTop: 12, fontSize: 14, lineHeight: 21, color: '#4A5568'},
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButton: {backgroundColor: '#008178'},
  payButtonText: {fontSize: 16, fontWeight: '600', color: '#FFFFFF'},
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  cancelButtonText: {color: '#DC2626'},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18},
  modalTitle: {fontSize: 17, fontWeight: '700', color: '#111820', marginBottom: 12},
  reasonInput: {
    minHeight: 90,
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    padding: 12,
    textAlignVertical: 'top',
    color: '#111820',
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
  modalGhostText: {fontSize: 15, fontWeight: '600', color: '#111820'},
  modalPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008178',
  },
});
