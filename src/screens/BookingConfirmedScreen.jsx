import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const BookingConfirmedScreen = ({navigation, route}) => {
  const {message, status, bookingNumber} = route.params || {};

  const handleTrackBooking = () => {
    navigation?.navigate('Main', {screen: 'Bookings'});
  };

  const handleBackHome = () => {
    navigation?.reset({
      index: 0,
      routes: [{name: 'Main'}],
    });
  };

  const statusLabel = (status || 'PENDING_PAYMENT').replace(/_/g, ' ');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.successCircle}>
          <Icon name="checkmark" size={40} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Booking confirmed</Text>
        {/* <Text style={styles.subtitle}>
          {message || 'Your booking has been placed successfully.'}
        </Text> */}

        <View style={styles.card}>
          {!!bookingNumber && (
            <>
              <Text style={styles.metaLabel}>Booking number</Text>
              <Text style={styles.metaValue}>{bookingNumber}</Text>
              <View style={styles.divider} />
            </>
          )}

          <Text style={styles.metaLabel}>Status</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Icon name="notifications-outline" size={20} color="#008178" />
          <Text style={styles.noteText}>
            You will get a notification when your caregiver is accepted.
          </Text>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryButton}
          onPress={handleTrackBooking}>
          <Text style={styles.primaryButtonText}>View bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryButton}
          onPress={handleBackHome}>
          <Text style={styles.secondaryButtonText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookingConfirmedScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 20,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 22,
    color: '#8190A7',
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 13,
    color: '#8190A7',
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111820',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 16,
  },
  statusBadge: {
    backgroundColor: '#E6F4F3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#008178',
    textTransform: 'capitalize',
  },
  noteBox: {
    marginTop: 16,
    backgroundColor: '#E6F4F3',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#008178',
  },
  spacer: {
    flex: 1,
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#008178',
  },
});
