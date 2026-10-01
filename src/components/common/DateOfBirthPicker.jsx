import React, {useEffect, useMemo, useState} from 'react';
import {View, Text, StyleSheet, Modal, Pressable, FlatList} from 'react-native';
import {
  MONTH_NAMES,
  daysInMonth,
  parseYmd,
  toYmd,
  todayParts,
} from '../../utils/account';

const TEAL = '#0B8A80';
const ROW = 44;
const YEAR_SPAN = 100;
const DEFAULT_AGE = 30;

const clampToToday = parts => {
  const today = todayParts();
  let {year, month, day} = parts;
  if (year > today.year) {
    year = today.year;
  }
  if (year === today.year && month > today.month) {
    month = today.month;
  }
  day = Math.min(day, daysInMonth(year, month));
  if (year === today.year && month === today.month && day > today.day) {
    day = today.day;
  }
  return {year, month, day};
};

function Column({data, selected, isDisabled, onSelect, label}) {
  const index = Math.max(0, data.findIndex(item => item.value === selected));
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <FlatList
        data={data}
        keyExtractor={item => String(item.value)}
        initialScrollIndex={Math.max(0, index - 2)}
        getItemLayout={(_d, i) => ({length: ROW, offset: ROW * i, index: i})}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        renderItem={({item}) => {
          const disabled = isDisabled(item.value);
          const active = item.value === selected;
          return (
            <Pressable
              disabled={disabled}
              onPress={() => onSelect(item.value)}
              style={[styles.row, active && styles.rowActive]}>
              <Text
                style={[
                  styles.rowText,
                  active && styles.rowTextActive,
                  disabled && styles.rowTextDisabled,
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

/** value / onChange use "YYYY-MM-DD". Future dates cannot be picked. */
const DateOfBirthPicker = ({visible, value, onClose, onChange}) => {
  const today = todayParts();
  const [parts, setParts] = useState(() =>
    clampToToday(parseYmd(value) || {year: today.year - DEFAULT_AGE, month: 1, day: 1}),
  );

  useEffect(() => {
    if (visible) {
      const now = todayParts();
      setParts(
        clampToToday(parseYmd(value) || {year: now.year - DEFAULT_AGE, month: 1, day: 1}),
      );
    }
  }, [visible, value]);

  const years = useMemo(
    () =>
      Array.from({length: YEAR_SPAN + 1}, (_v, i) => {
        const year = today.year - i;
        return {value: year, label: String(year)};
      }),
    [today.year],
  );
  const months = MONTH_NAMES.map((name, i) => ({value: i + 1, label: name}));
  const days = Array.from({length: 31}, (_v, i) => ({value: i + 1, label: String(i + 1)}));

  const update = patch => setParts(prev => clampToToday({...prev, ...patch}));

  const isFutureMonth = month => parts.year === today.year && month > today.month;
  const isDisabledDay = day =>
    day > daysInMonth(parts.year, parts.month) ||
    (parts.year === today.year && parts.month === today.month && day > today.day);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Date of birth</Text>
          <View style={styles.columns}>
            <Column
              label="Day"
              data={days}
              selected={parts.day}
              isDisabled={isDisabledDay}
              onSelect={day => update({day})}
            />
            <Column
              label="Month"
              data={months}
              selected={parts.month}
              isDisabled={isFutureMonth}
              onSelect={month => update({month})}
            />
            <Column
              label="Year"
              data={years}
              selected={parts.year}
              isDisabled={() => false}
              onSelect={year => update({year})}
            />
          </View>
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onChange(toYmd(parts));
                onClose();
              }}
              style={[styles.btn, styles.btnPrimary]}>
              <Text style={styles.btnPrimaryText}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default DateOfBirthPicker;

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end'},
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E1E6EA',
    marginBottom: 12,
  },
  title: {fontSize: 17, fontWeight: '700', color: '#15202B', marginBottom: 8},
  columns: {flexDirection: 'row', gap: 8},
  column: {flex: 1},
  columnLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#8A97A6',
    marginBottom: 4,
  },
  list: {height: ROW * 5},
  row: {height: ROW, alignItems: 'center', justifyContent: 'center', borderRadius: 10},
  rowActive: {backgroundColor: '#E7F6F4'},
  rowText: {fontSize: 16, color: '#374151', fontWeight: '500'},
  rowTextActive: {color: TEAL, fontWeight: '800'},
  rowTextDisabled: {color: '#D1D5DB'},
  actions: {flexDirection: 'row', gap: 10, marginTop: 16},
  btn: {flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  btnGhost: {backgroundColor: '#F4F6F8'},
  btnGhostText: {fontSize: 15, fontWeight: '700', color: '#15202B'},
  btnPrimary: {backgroundColor: TEAL},
  btnPrimaryText: {fontSize: 15, fontWeight: '700', color: '#FFFFFF'},
});
