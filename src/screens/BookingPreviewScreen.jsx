import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Loader from '../components/common/Loader';
import Header from '../components/common/Header';
import {useCreateBooking} from '../api/mutations';
import {storage} from '../utils/storage';

const toStartTime = timeValue => {
  if (!timeValue) {
    return '';
  }
  const raw = String(timeValue).trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) {
    return raw.replace(/\s*(AM|PM)$/i, '');
  }
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) {
    hours += 12;
  }
  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const mapServiceType = (selectedService, selectedHospital) => {
  if (selectedHospital) {
    return 'HOSPITAL_ASSISTANCE';
  }
  const key = selectedService?.id || selectedService?.category || '';
  if (key === 'hospital_companion') {
    return 'HOSPITAL_ASSISTANCE';
  }
  return 'HOME_CARE';
};

const Row = ({label, value, last}) => (
  <View style={[styles.row, last && styles.rowLast]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value || '—'}</Text>
  </View>
);

const BookingPreviewScreen = ({navigation, route}) => {
  const {
    selectedMember,
    selectedCaregiver,
    selectedService,
    selectedArea,
    selectedHospital,
    selectedDate,
    selectedTime,
    durationHours = 4,
    notes = '',
  } = route.params || {};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const createBooking = useCreateBooking();

  const hourlyRate =
    selectedCaregiver?.hourly_rate ||
    selectedCaregiver?.price ||
    selectedService?.price ||
    500;
  const estimatedTotal = Number(hourlyRate) * Number(durationHours);

  const locationText = [
    selectedArea?.fullAddress,
    selectedArea?.thana,
    selectedArea?.district,
  ]
    .filter(Boolean)
    .join(', ');

  const scheduleText =
    selectedDate && selectedTime
      ? `${selectedDate.day}, ${selectedDate.date} ${selectedDate.month} · ${selectedTime.time} · ${durationHours}h`
      : '—';

  const handleConfirm = async () => {
    if (!selectedMember || !selectedCaregiver) {
      Alert.alert('Error', 'Missing booking details. Please go back and try again.');
      return;
    }

    const token = await storage.getAuthToken();
    if (!token) {
      Alert.alert('Error', 'Please login to book an appointment');
      return;
    }

    if (!selectedHospital?.id) {
      Alert.alert('Error', 'Please select a hospital to continue');
      return;
    }

    setIsSubmitting(true);

    const bookingData = {
      family_member_id: selectedMember.id || selectedMember.uuid,
      provider_id: selectedCaregiver.id || selectedCaregiver.uuid,
      hospital_id: selectedHospital.id,
      booking_date: selectedDate.fullDate,
      start_time: toStartTime(selectedTime.time),
      duration_hours: durationHours,
      service_type: mapServiceType(selectedService, selectedHospital),
      patient_requirements: selectedService?.title
        ? `${selectedService.title} service requested`
        : 'Home care service',
      notes: notes || '',
    };

    try {
      const response = await createBooking.mutateAsync(bookingData);
      await storage.clearBookingData();
      navigation?.navigate('BookingConfirmed', {
        message: response.message || 'Booking created successfully',
        status: response.data?.status || 'PENDING_PAYMENT',
        bookingNumber: response.data?.booking_number,
      });
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={isSubmitting} />
      <Header title="Booking Preview" onBack={() => navigation?.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>
          Review your booking details before confirming
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="person-outline" size={18} color="#008178" />
            <Text style={styles.cardTitle}>Care recipient</Text>
          </View>
          <Row label="Name" value={selectedMember?.name} />
          <Row
            label="Relation"
            value={selectedMember?.relationship}
            last
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="grid-outline" size={18} color="#008178" />
            <Text style={styles.cardTitle}>Service</Text>
          </View>
          <Row label="Type" value={selectedService?.title} />
          <Row label="Rate" value={selectedService?.priceLabel} last />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="medkit-outline" size={18} color="#008178" />
            <Text style={styles.cardTitle}>Care provider</Text>
          </View>
          <Row label="Name" value={selectedCaregiver?.name} />
          <Row
            label="Experience"
            value={
              selectedCaregiver?.experience_years
                ? `${selectedCaregiver.experience_years} years`
                : '—'
            }
            last
          />
        </View>

        {!!selectedHospital?.name && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="business-outline" size={18} color="#008178" />
              <Text style={styles.cardTitle}>Hospital</Text>
            </View>
            <Text style={styles.locationText}>{selectedHospital.name}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="location-outline" size={18} color="#008178" />
            <Text style={styles.cardTitle}>Location</Text>
          </View>
          <Text style={styles.locationText}>{locationText || '—'}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="calendar-outline" size={18} color="#008178" />
            <Text style={styles.cardTitle}>Schedule</Text>
          </View>
          <Text style={styles.locationText}>{scheduleText}</Text>
        </View>

        {!!notes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="document-text-outline" size={18} color="#008178" />
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            <Text style={styles.locationText}>{notes}</Text>
          </View>
        )}

        <View style={styles.pricingCard}>
          <Text style={styles.pricingLabel}>Estimated pricing</Text>
          <Text style={styles.pricingValue}>৳{estimatedTotal}</Text>
          <Text style={styles.pricingNote}>
            ৳{hourlyRate}/hr × {durationHours} hours
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.confirmButton}
          onPress={handleConfirm}
          disabled={isSubmitting}>
          <Text style={styles.confirmButtonText}>Confirm booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookingPreviewScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  hint: {
    fontSize: 14,
    color: '#8190A7',
    marginBottom: 16,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111820',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    gap: 12,
  },
  rowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  rowLabel: {
    fontSize: 13,
    color: '#8190A7',
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#111820',
  },
  locationText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#111820',
    fontWeight: '500',
  },
  pricingCard: {
    backgroundColor: '#E6F4F3',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  pricingLabel: {
    fontSize: 13,
    color: '#008178',
    marginBottom: 4,
  },
  pricingValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111820',
  },
  pricingNote: {
    marginTop: 4,
    fontSize: 12,
    color: '#8190A7',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,

  },
  confirmButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#B5C0D0',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
