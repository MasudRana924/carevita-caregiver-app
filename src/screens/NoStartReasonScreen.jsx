import React, {useState} from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import {FORM} from '../components/common/formStyles';
import {useReportNoStart} from '../api/mutations';
import {useBookingDetails} from '../api/queries';
import {isConflict} from '../api/envelope';
import {showError} from '../context/ErrorModalContext';
import {showAlert} from '../context/AlertModalContext';

const MAX_REASON = 500;
const STARTED_STATUSES = [
  'SERVICE_IN_PROGRESS',
  'IN_PROGRESS',
  'SERVICE_COMPLETED',
  'COMPLETED',
];

const NoStartReasonScreen = ({navigation, route}) => {
  const bookingId = route?.params?.bookingId;
  const reportNoStart = useReportNoStart();
  const {data: bookingData, isLoading} = useBookingDetails(bookingId);
  const booking = bookingData?.data || null;
  const alreadyStarted = STARTED_STATUSES.includes(booking?.status);
  const [reason, setReason] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      showError('Please tell us why you did not start', 'Required');
      return;
    }
    if (!bookingId) {
      showError('Booking not found');
      return;
    }

    try {
      await reportNoStart.mutateAsync({
        id: bookingId,
        reason: trimmed,
        is_emergency: isEmergency,
      });
      showAlert(
        'Submitted',
        isEmergency
          ? 'Your reason was sent. The family has been told it was an emergency.'
          : 'Your reason was sent to the family.',
        [{text: 'OK', onPress: () => navigation?.goBack()}],
      );
    } catch (error) {
      if (isConflict(error)) {
        setAlreadySent(true);
        showError(
          error?.message || 'A reason was already sent for this booking.',
          'Already submitted',
        );
        return;
      }
      showError(error?.message || 'Failed to send reason');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={isLoading || reportNoStart.isPending} overlay />
      <Header title="Service not started" onBack={() => navigation?.goBack()} />
      {isLoading ? null : alreadyStarted ? (
        <View style={styles.content}>
          <Text style={styles.intro}>
            This service has already started, so there is nothing to report.
          </Text>
          <AppButton title="Okay" onPress={() => navigation?.goBack()} />
        </View>
      ) : (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            The booked time ended and this service was not started. Tell the
            family why. If it was an emergency, turn on the switch below.
          </Text>

          <AppInput
            label="Reason"
            value={reason}
            onChangeText={text => setReason(text.slice(0, MAX_REASON))}
            placeholder="Why did you not start this service?"
            multiline
            maxLength={MAX_REASON}
            editable={!alreadySent}
          />
          <Text style={styles.counter}>
            {reason.length}/{MAX_REASON}
          </Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>This was an emergency</Text>
            <Switch
              value={isEmergency}
              onValueChange={setIsEmergency}
              disabled={alreadySent}
              trackColor={{false: '#D1D5DB', true: FORM.teal}}
              thumbColor="#FFFFFF"
            />
          </View>

          <AppButton
            title={alreadySent ? 'Already submitted' : 'Submit'}
            onPress={handleSubmit}
            disabled={alreadySent || reportNoStart.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

export default NoStartReasonScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  flex: {flex: 1},
  content: {paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24},
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: FORM.muted,
    marginBottom: 16,
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: -10,
    marginBottom: 16,
    fontSize: 12,
    color: FORM.muted,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  switchLabel: {fontSize: 15, fontWeight: '600', color: FORM.title},
});
