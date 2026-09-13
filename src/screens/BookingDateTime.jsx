import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';

const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const TIMES = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
].map((time, index) => ({id: index + 1, time}));

const DURATIONS = [2, 3, 4, 5, 6, 8];

const startOfDay = date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toDateObject = date => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return {
    id: `${yyyy}-${mm}-${dd}`,
    day: DAY_LABELS[date.getDay()],
    month: MONTH_SHORT[date.getMonth()],
    date: dd,
    fullDate: `${yyyy}-${mm}-${dd}`,
    isToday: startOfDay(date).getTime() === startOfDay(new Date()).getTime(),
  };
};

const buildMonthCells = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const today = startOfDay(new Date());
  const cells = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push({key: `empty-${i}`, empty: true});
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isPast = startOfDay(date).getTime() < today.getTime();
    const isSunday = date.getDay() === 0;
    cells.push({
      key: `${year}-${month}-${day}`,
      day,
      date,
      isPast,
      isSunday,
      dateObj: toDateObject(date),
    });
  }

  return cells;
};

const MonthCalendar = ({selectedDate, onSelectDate}) => {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const cells = useMemo(
    () => buildMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const weeks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      const week = cells.slice(i, i + 7);
      while (week.length < 7) {
        week.push({key: `pad-${i}-${week.length}`, empty: true});
      }
      rows.push(week);
    }
    return rows;
  }, [cells]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.navBtn}
          onPress={goPrevMonth}>
          <Icon name="chevron-back" size={20} color="#111820" />
        </TouchableOpacity>

        <View style={styles.monthTitleWrap}>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
       
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.navBtnNext}
          onPress={goNextMonth}>
          <Icon name="chevron-forward" size={20} color="#008178" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEK_DAYS.map(day => (
          <View key={day} style={styles.weekCell}>
            <Text style={styles.weekLabel}>{day}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={`week-${weekIndex}`} style={styles.daysRow}>
          {week.map(cell => {
            if (cell.empty) {
              return <View key={cell.key} style={styles.dayCell} />;
            }

            const selected = selectedDate?.fullDate === cell.dateObj.fullDate;
            const disabled = cell.isPast;

            return (
              <TouchableOpacity
                key={cell.key}
                activeOpacity={disabled ? 1 : 0.8}
                disabled={disabled}
                style={styles.dayCell}
                onPress={() => onSelectDate(cell.dateObj)}>
                <View
                  style={[
                    styles.dayCircle,
                    selected && styles.dayCircleSelected,
                  ]}>
                  <Text
                    style={[
                      styles.dayNumber,
                      (disabled || cell.isSunday) && styles.dayNumberMuted,
                      selected && styles.dayNumberSelected,
                    ]}>
                    {cell.day}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const BookingDateTime = ({navigation, route}) => {
  const {
    selectedMember,
    selectedCaregiver,
    selectedService,
    selectedArea,
    selectedHospital,
    serviceType,
  } = route.params || {};

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [durationHours, setDurationHours] = useState(4);
  const [notes, setNotes] = useState('');

  const canContinue = !!selectedDate && !!selectedTime;

  const handleNext = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Schedule', 'Please select date and time');
      return;
    }

    navigation?.navigate('BookingPreview', {
      selectedMember,
      selectedCaregiver,
      selectedService,
      selectedArea,
      selectedHospital,
      serviceType,
      selectedDate,
      selectedTime,
      durationHours,
      notes: notes.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Book appointment" onBack={() => navigation?.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageHint}>
          Choose when you need the caregiver
        </Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Date</Text>
          <MonthCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
            Time
          </Text>
          <View style={styles.timeGrid}>
            {TIMES.map(time => {
              const selected = selectedTime?.id === time.id;
              return (
                <TouchableOpacity
                  key={time.id}
                  activeOpacity={0.85}
                  style={[styles.timeChip, selected && styles.chipSelected]}
                  onPress={() => setSelectedTime(time)}>
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}>
                    {time.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map(hours => {
              const selected = durationHours === hours;
              return (
                <TouchableOpacity
                  key={hours}
                  activeOpacity={0.85}
                  style={[
                    styles.durationChip,
                    selected && styles.chipSelected,
                  ]}
                  onPress={() => setDurationHours(hours)}>
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}>
                    {hours}h
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.notesTitle]}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Write any extra details for the caregiver..."
          placeholderTextColor="#8190A7"
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.nextButton, !canContinue && styles.disabledButton]}
          onPress={handleNext}
          disabled={!canContinue}>
          <Text style={styles.nextButtonText}>Preview booking</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BookingDateTime;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  pageHint: {
    fontSize: 14,
    color: '#8190A7',
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,

  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111820',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  sectionTitleSpaced: {
    marginTop: 8,
  },
  calendar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingBottom: 4,
    marginBottom: 18,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnNext: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111820',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#8190A7',
    letterSpacing: 0.2,
  },
  daysRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dayCell: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: '#008178',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111820',
  },
  dayNumberMuted: {
    color: '#C8D0DC',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  timeChip: {
    width: '47%',
    flexGrow: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 8,
  },
  durationChip: {
    minWidth: 48,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: '#008178',
    borderColor: '#008178',
    borderRadius: 12,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111820',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  notesTitle: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  notesInput: {
    minHeight: 110,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E8F0',
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: '#111820',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  nextButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#B5C0D0',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
