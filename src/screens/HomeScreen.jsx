import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeHeader from '../components/home/HomeHeader';
import {useAuth} from '../context/AuthContext';
import {
  useBookings,
  useCaregiverProfile,
  useInboxUnreadCount,
  useWallet,
} from '../api/queries';
import {useUpdateCaregiverProfile} from '../api/mutations';

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

const HomeScreen = ({navigation}) => {
  const {completeCaregiverProfile} = useAuth();
  const profileQuery = useCaregiverProfile();
  const assignedQuery = useBookings({status: 'PROVIDER_ASSIGNED', limit: 20});
  const recentQuery = useBookings({limit: 5});
  const walletQuery = useWallet({limit: 5, offset: 0});
  const unreadQuery = useInboxUnreadCount();
  const updateProfile = useUpdateCaregiverProfile();

  const profile = profileQuery.data?.data || {};
  const unwrapBookings = payload =>
    Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.data?.bookings)
        ? payload.data.bookings
        : [];
  const assigned = unwrapBookings(assignedQuery.data);
  const recent = unwrapBookings(recentQuery.data);
  const wallet = walletQuery.data?.data || {};
  const unread = unreadQuery.data?.unread ?? unreadQuery.data?.data?.unread ?? 0;
  const isAvailable = profile.is_available !== false;

  const refreshing =
    profileQuery.isRefetching ||
    assignedQuery.isRefetching ||
    recentQuery.isRefetching ||
    walletQuery.isRefetching;

  const onRefresh = () => {
    profileQuery.refetch();
    assignedQuery.refetch();
    recentQuery.refetch();
    walletQuery.refetch();
    unreadQuery.refetch();
  };

  const toggleAvailability = async () => {
    try {
      const response = await updateProfile.mutateAsync({
        fields: {is_available: !isAvailable},
      });
      if (response?.data) {
        completeCaregiverProfile(response.data);
      }
      profileQuery.refetch();
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <HomeHeader navigation={navigation} unreadCount={unread} />

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.availCard}
          onPress={toggleAvailability}
          disabled={updateProfile.isPending}>
          <View>
            <Text style={styles.availTitle}>
              {isAvailable ? 'You are available' : 'You are unavailable'}
            </Text>
            <Text style={styles.availSub}>
              {isAvailable
                ? 'New booking requests can be assigned to you'
                : 'Tap to start receiving new bookings'}
            </Text>
          </View>
          <View style={[styles.toggle, isAvailable && styles.toggleOn]}>
            <View style={[styles.knob, isAvailable && styles.knobOn]} />
          </View>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('Bookings', {status: 'PROVIDER_ASSIGNED'})
            }>
            <Text style={styles.statValue}>{assigned.length}</Text>
            <Text style={styles.statLabel}>New requests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.statValue}>
              ৳{formatAmount(wallet.balance ?? 0)}
            </Text>
            <Text style={styles.statLabel}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {assigned.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Needs response</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Bookings', {
                    status: 'PROVIDER_ASSIGNED',
                  })
                }>
                <Text style={styles.link}>See all</Text>
              </TouchableOpacity>
            </View>
            {assigned.slice(0, 3).map(booking => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('BookingDetails', {
                    bookingId: booking.id,
                  })
                }>
                <View style={styles.bookingTop}>
                  <Text style={styles.bookingId}>
                    {booking.booking_number || 'Booking'}
                  </Text>
                  <View style={styles.requestBadge}>
                    <Text style={styles.requestBadgeText}>Accept / Reject</Text>
                  </View>
                </View>
                <Text style={styles.bookingMeta}>
                  {booking.customer_name || booking.user?.name || 'Family'}
                  {booking.hospital_name ? ` · ${booking.hospital_name}` : ''}
                </Text>
                <Text style={styles.bookingMeta}>
                  {formatDate(booking.booking_date)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Recent bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
              <Text style={styles.link}>See all</Text>
            </TouchableOpacity>
          </View>
          {recent.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="calendar-outline" size={32} color="#008178" />
              <Text style={styles.emptyText}>
                New booking requests will appear here
              </Text>
            </View>
          ) : (
            recent.map(booking => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('BookingDetails', {
                    bookingId: booking.id,
                  })
                }>
                <View style={styles.bookingTop}>
                  <Text style={styles.bookingId}>
                    {booking.booking_number || 'Booking'}
                  </Text>
                  <Text style={styles.status}>
                    {(booking.status || '').replace(/_/g, ' ')}
                  </Text>
                </View>
                <Text style={styles.bookingMeta}>
                  {booking.customer_name ||
                    booking.family_member_name ||
                    'Family'}
                  {booking.hospital_name ? ` · ${booking.hospital_name}` : ''}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  scrollContent: {paddingHorizontal: 16, paddingBottom: 28},
  availCard: {
    marginTop: 18,
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availTitle: {fontSize: 16, fontWeight: '700', color: '#111820'},
  availSub: {marginTop: 4, fontSize: 13, color: '#8190A7', maxWidth: 230},
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {backgroundColor: '#0ee60e'},
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  knobOn: {alignSelf: 'flex-end'},
  statsRow: {flexDirection: 'row', gap: 12, marginTop: 14},
  statCard: {
    flex: 1,
    backgroundColor: '#E6F4F3',
    borderRadius: 16,
    padding: 16,
  },
  statValue: {fontSize: 20, fontWeight: '700', color: '#008178'},
  statLabel: {marginTop: 4, fontSize: 13, color: '#4A5568'},
  section: {marginTop: 22},
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {fontSize: 16, fontWeight: '700', color: '#111820'},
  link: {fontSize: 13, fontWeight: '600', color: '#008178'},
  bookingCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  bookingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookingId: {fontSize: 14, fontWeight: '700', color: '#111820'},
  status: {
    fontSize: 11,
    fontWeight: '600',
    color: '#008178',
    textTransform: 'capitalize',
  },
  requestBadge: {
    backgroundColor: '#008178',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  requestBadgeText: {fontSize: 10, fontWeight: '700', color: '#FFFFFF'},
  bookingMeta: {fontSize: 13, color: '#8190A7', marginTop: 2},
  empty: {alignItems: 'center', paddingVertical: 28},
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: '#8190A7',
    textAlign: 'center',
  },
});
