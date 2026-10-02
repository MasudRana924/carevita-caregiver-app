import React from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet} from 'react-native';
import {FORM, formStyles} from '../common/formStyles';
import {AUTH} from './AuthShell';

export const AuthChannelToggle = ({value, onChange}) => (
  <View style={styles.track}>
    {[
      {key: 'email', label: 'Email'},
      {key: 'phone', label: 'Phone'},
    ].map(option => {
      const active = value === option.key;
      return (
        <TouchableOpacity
          key={option.key}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{selected: active}}
          style={[styles.segment, active && styles.segmentActive]}
          onPress={() => onChange(option.key)}>
          <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export const PhoneField = ({value, onChangeText, error}) => (
  <View style={styles.phoneWrap}>
    <View style={[formStyles.inputRow, error ? styles.rowTight : null]}>
      <View style={styles.prefix}>
        <View style={styles.flag}>
          <View style={styles.flagDisc} />
        </View>
        <Text style={styles.prefixText}>+880</Text>
      </View>
      <View style={styles.divider} />
      <TextInput
        style={formStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="1XXXXXXXXX"
        placeholderTextColor={FORM.placeholder}
        keyboardType="number-pad"
        maxLength={13}
        selectionColor={AUTH.teal}
        accessibilityLabel="Mobile number"
      />
    </View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: '#F4F7F6',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E6EEEA',
    padding: 4,
    marginBottom: 18,
  },
  segment: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: AUTH.teal,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8A97A6',
  },
  segmentLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  phoneWrap: {width: '100%'},
  rowTight: {marginBottom: 6},
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  flag: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#006A4E',
    justifyContent: 'center',
  },
  flagDisc: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#F42A41',
    marginLeft: 5,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '600',
    color: FORM.title,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#D5E0DC',
  },
  error: {
    fontSize: 12,
    color: FORM.danger,
    marginLeft: 8,
    marginBottom: 12,
  },
});
