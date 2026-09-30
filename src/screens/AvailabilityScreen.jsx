import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import AppButton, {AppButtonBar} from '../components/common/AppButton';
import {useAvailability} from '../api/queries';
import {useUpdateAvailability} from '../api/mutations';
import {unwrapList} from '../api/envelope';
import {showError} from '../context/ErrorModalContext';
import {showAlert} from '../context/AlertModalContext';

const DAYS = [
  {value: 0, label: 'Sunday'},
  {value: 1, label: 'Monday'},
  {value: 2, label: 'Tuesday'},
  {value: 3, label: 'Wednesday'},
  {value: 4, label: 'Thursday'},
  {value: 5, label: 'Friday'},
  {value: 6, label: 'Saturday'},
];

const emptyDays = () =>
  DAYS.map(day => ({day_of_week: day.value, is_active: false}));

const AvailabilityScreen = ({navigation}) => {
  const {data, isLoading} = useAvailability();
  const saveMutation = useUpdateAvailability();

  const [days, setDays] = useState(emptyDays);

  useEffect(() => {
    const slots = unwrapList(data);
    const next = emptyDays();
    slots.forEach(slot => {
      const dayOfWeek = Number(slot?.day_of_week);
      const index = next.findIndex(item => item.day_of_week === dayOfWeek);
      if (index >= 0) {
        next[index] = {day_of_week: dayOfWeek, is_active: slot.is_active !== false};
      }
    });
    setDays(next);
  }, [data]);

  const activeCount = days.filter(day => day.is_active).length;

  const toggleDay = dayOfWeek => {
    setDays(prev =>
      prev.map(day =>
        day.day_of_week === dayOfWeek ? {...day, is_active: !day.is_active} : day,
      ),
    );
  };

  const handleSave = async () => {
    const slots = days.map(day => ({
      day_of_week: day.day_of_week,
      is_active: day.is_active,
    }));

    try {
      await saveMutation.mutateAsync(slots);
      showAlert(
        'Saved',
        activeCount === 0
          ? 'All days are off. You will not get bookings on any day.'
          : 'Active days updated. You can be booked for any time on these days.',
      );
      navigation?.goBack();
    } catch (error) {
      showError(error?.message || 'Failed to save availability');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={isLoading || saveMutation.isPending} overlay />
      <Header title="Weekly availability" onBack={() => navigation?.goBack()} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Turn on the days you work. On an active day you can be booked for any
          time.
        </Text>
        {days.map(day => {
          const label = DAYS.find(item => item.value === day.day_of_week)?.label;
          return (
            <TouchableOpacity
              key={day.day_of_week}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => toggleDay(day.day_of_week)}>
              <View>
                <Text style={styles.dayLabel}>{label}</Text>
                <Text style={styles.dayStatus}>
                  {day.is_active ? 'Active' : 'Off'}
                </Text>
              </View>
              <View style={[styles.toggle, day.is_active && styles.toggleOn]}>
                <View style={[styles.knob, day.is_active && styles.knobOn]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <AppButtonBar>
        <AppButton
          title="Save days"
          onPress={handleSave}
          disabled={isLoading || saveMutation.isPending}
          style={styles.flexBtn}
        />
      </AppButtonBar>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  dayLabel: {fontSize: 15, fontWeight: '700', color: '#111820'},
  dayStatus: {marginTop: 2, fontSize: 12, color: '#8190A7'},
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
  flexBtn: {flex: 1},
});
