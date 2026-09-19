import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import {useAvailability} from '../api/queries';
import {useUpdateAvailability} from '../api/mutations';
import {unwrapList} from '../api/envelope';

const DAYS = [
  {value: 0, label: 'Sunday'},
  {value: 1, label: 'Monday'},
  {value: 2, label: 'Tuesday'},
  {value: 3, label: 'Wednesday'},
  {value: 4, label: 'Thursday'},
  {value: 5, label: 'Friday'},
  {value: 6, label: 'Saturday'},
];

const emptyDay = day => ({
  day_of_week: day,
  start_time: '09:00',
  end_time: '18:00',
  is_active: false,
});

const normalizeTime = value => {
  const raw = String(value || '').trim();
  if (/^\d{2}:\d{2}$/.test(raw)) {
    return raw;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) {
    return raw.slice(0, 5);
  }
  return raw;
};

const AvailabilityScreen = ({navigation}) => {
  const {data, isLoading} = useAvailability();
  const saveMutation = useUpdateAvailability();

  const [days, setDays] = useState(DAYS.map(day => emptyDay(day.value)));

  useEffect(() => {
    const slots = unwrapList(data);
    const next = DAYS.map(day => emptyDay(day.value));
    slots.forEach(slot => {
      const index = next.findIndex(item => item.day_of_week === slot.day_of_week);
      if (index >= 0) {
        next[index] = {
          day_of_week: slot.day_of_week,
          start_time: normalizeTime(slot.start_time) || '09:00',
          end_time: normalizeTime(slot.end_time) || '18:00',
          is_active: slot.is_active !== false,
        };
      }
    });
    setDays(next);
  }, [data]);

  const hasSlots = days.some(day => day.is_active);

  const updateDay = (dayOfWeek, patch) => {
    setDays(prev =>
      prev.map(day =>
        day.day_of_week === dayOfWeek ? {...day, ...patch} : day,
      ),
    );
  };

  const handleSave = async () => {
    const slots = days
      .filter(day => day.is_active)
      .map(day => ({
        day_of_week: day.day_of_week,
        start_time: normalizeTime(day.start_time),
        end_time: normalizeTime(day.end_time),
        is_active: true,
      }));

    const invalid = slots.find(
      slot => !/^\d{2}:\d{2}$/.test(slot.start_time) || !/^\d{2}:\d{2}$/.test(slot.end_time),
    );
    if (invalid) {
      Alert.alert('Invalid time', 'Use HH:MM, for example 09:00');
      return;
    }

    try {
      await saveMutation.mutateAsync(slots);
      Alert.alert(
        'Saved',
        slots.length === 0
          ? 'No weekly slots. You are available all day.'
          : 'Weekly availability updated. New bookings must fit these hours.',
      );
      navigation?.goBack();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to save availability');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={saveMutation.isPending} overlay />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <Header
          title="Weekly availability"
          onBack={() => navigation?.goBack()}
        />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            {hasSlots
              ? 'Bookings must fit these hours. Turn a day off to skip it.'
              : 'No slots means you are available all day. Add hours only if you want limits.'}
          </Text>
          {isLoading ? (
            <Text style={styles.intro}>Loading availability...</Text>
          ) : null}
          {days.map(day => {
            const label = DAYS.find(item => item.value === day.day_of_week)?.label;
            return (
              <View key={day.day_of_week} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardHead}
                  onPress={() =>
                    updateDay(day.day_of_week, {is_active: !day.is_active})
                  }>
                  <Text style={styles.dayLabel}>{label}</Text>
                  <View
                    style={[styles.toggle, day.is_active && styles.toggleOn]}>
                    <View
                      style={[
                        styles.knob,
                        day.is_active && styles.knobOn,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
                {day.is_active ? (
                  <View style={styles.timeRow}>
                    <View style={styles.timeCol}>
                      <Text style={styles.timeLabel}>Start</Text>
                      <TextInput
                        style={styles.input}
                        value={day.start_time}
                        onChangeText={text =>
                          updateDay(day.day_of_week, {start_time: text})
                        }
                        placeholder="09:00"
                        placeholderTextColor="#8190A7"
                      />
                    </View>
                    <View style={styles.timeCol}>
                      <Text style={styles.timeLabel}>End</Text>
                      <TextInput
                        style={styles.input}
                        value={day.end_time}
                        onChangeText={text =>
                          updateDay(day.day_of_week, {end_time: text})
                        }
                        placeholder="18:00"
                        placeholderTextColor="#8190A7"
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.85}
            onPress={handleSave}>
            <Text style={styles.saveText}>Save hours</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AvailabilityScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  flex: {flex: 1},
  content: {paddingHorizontal: 20, paddingBottom: 24},
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8190A7',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabel: {fontSize: 15, fontWeight: '700', color: '#111820'},
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {backgroundColor: '#008178'},
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  knobOn: {alignSelf: 'flex-end'},
  timeRow: {flexDirection: 'row', gap: 10, marginTop: 12},
  timeCol: {flex: 1},
  timeLabel: {fontSize: 12, color: '#8190A7', marginBottom: 6},
  input: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111820',
    borderWidth: 1,
    borderColor: '#E3E8F0',
  },
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  saveButton: {
    height: 52,
    backgroundColor: '#008178',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {fontSize: 16, fontWeight: '600', color: '#FFFFFF'},
});
