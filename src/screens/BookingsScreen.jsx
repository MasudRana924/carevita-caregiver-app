import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useBookings} from '../api/queries';
import Header from '../components/common/Header';
import BookingSkeleton from '../components/home/BookingSkeleton';

const FILTERS = [
  {key: '', label: 'All'},
  {key: 'PROVIDER_ASSIGNED', label: 'New'},
  {key: 'PROVIDER_ACCEPTED', label: 'Accepted'},
  {key: 'IN_PROGRESS', label: 'In progress'},
  {key: 'COMPLETED', label: 'Completed'},
  {key: 'CANCELLED', label: 'Cancelled'},
];

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

const getPaymentStatusColor = status => {
  switch (status) {
    case 'PAID':
      return '#10B981';
    case 'PENDING':
      return '#F59E0B';
    case 'FAILED':
      return '#EF4444';
    default:
      return '#6B7280';
  }
};

const BookingsScreen = ({navigation, route}) => {
  const initialStatus = route?.params?.status || '';
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (route?.params?.status !== undefined) {
      setStatus(route.params.status);
    }
  }, [route?.params?.status]);
  const params = useMemo(
    () => ({limit: 20, ...(status ? {status} : {})}),
    [status],
  );
  const {data: bookingsData, isLoading} = useBookings(params);
  const bookings = Array.isArray(bookingsData?.data)
    ? bookingsData.data
    : Array.isArray(bookingsData?.data?.bookings)
      ? bookingsData.data.bookings
      : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="My Bookings" showBack={false} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}>
        {FILTERS.map(filter => {
          const active = status === filter.key;
          return (
            <TouchableOpacity
              key={filter.key || 'all'}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setStatus(filter.key)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <BookingSkeleton />
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="calendar-outline" size={64} color="#E3E8F0" />
            <Text style={styles.emptyTitle}>No bookings</Text>
            <Text style={styles.emptyText}>
              Assigned bookings will show up here
            </Text>
          </View>
        ) : (
          bookings.map(booking => (
            <TouchableOpacity
              key={booking.id}
              activeOpacity={0.85}
              style={styles.bookingCard}
              onPress={() =>
                navigation?.navigate('BookingDetails', {bookingId: booking.id})
              }>
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <Text style={styles.bookingIdLabel}>
                    {booking.booking_number || 'Booking'}
                  </Text>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {booking.customer_name ||
                      booking.family_member_name ||
                      'Family request'}
                  </Text>
                  {!!booking.hospital_name && (
                    <Text style={styles.meta} numberOfLines={1}>
                      {booking.hospital_name}
                    </Text>
                  )}
                  <View style={styles.dateInfo}>
                    <Icon name="calendar-outline" size={16} color="#8190A7" />
                    <Text style={styles.dateText}>
                      {formatDate(booking.booking_date)}
                    </Text>
                  </View>
                </View>
                <View style={styles.rightCol}>
                  <Text style={styles.amount}>
                    ৳{booking.total_amount || booking.caregiver_amount || '0'}
                  </Text>
                  <Icon name="chevron-forward" size={18} color="#8190A7" />
                </View>
              </View>
              <View style={styles.badgeRow}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {(booking.status || '').replace(/_/g, ' ')}
                  </Text>
                </View>
                {!!booking.payment_status && (
                  <View
                    style={[
                      styles.paymentBadge,
                      {
                        backgroundColor: getPaymentStatusColor(
                          booking.payment_status,
                        ),
                      },
                    ]}>
                    <Text style={styles.paymentText}>
                      {booking.payment_status}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#fff'},
  filters: {paddingHorizontal: 16, paddingBottom: 8, gap: 8},
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F6F6F6',
    marginRight: 8,
  },
  chipActive: {backgroundColor: '#008178'},
  chipText: {fontSize: 13, fontWeight: '600', color: '#8190A7'},
  chipTextActive: {color: '#FFFFFF'},
  scrollView: {flex: 1},
  scrollContent: {padding: 16},
  emptyState: {
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
  emptyText: {fontSize: 14, color: '#8190A7', marginTop: 8},
  bookingCard: {
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardLeft: {flex: 1, paddingRight: 8},
  bookingIdLabel: {fontSize: 12, color: '#8190A7', marginBottom: 2},
  customerName: {fontSize: 15, fontWeight: '700', color: '#111820'},
  meta: {fontSize: 13, color: '#8190A7', marginTop: 3},
  dateInfo: {flexDirection: 'row', alignItems: 'center', marginTop: 8},
  dateText: {fontSize: 13, color: '#8190A7', marginLeft: 6},
  rightCol: {alignItems: 'flex-end', gap: 10},
  amount: {fontSize: 14, fontWeight: '700', color: '#111820'},
  badgeRow: {flexDirection: 'row', gap: 8, marginTop: 12},
  statusBadge: {
    backgroundColor: '#E6F4F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#008178',
    textTransform: 'capitalize',
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paymentText: {fontSize: 11, fontWeight: '600', color: '#FFFFFF'},
});

export default BookingsScreen;
