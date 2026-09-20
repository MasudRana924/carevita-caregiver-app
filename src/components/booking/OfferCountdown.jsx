import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  formatOfferAcceptLabel,
  getOfferRemainingMs,
} from '../../utils/bookingTime';

const OfferCountdown = ({
  booking,
  nowTs = Date.now(),
  fallbackExpiresAt,
  style,
  textStyle,
}) => {
  const remaining = getOfferRemainingMs(booking, nowTs, fallbackExpiresAt);
  if (remaining == null) {
    return null;
  }

  const expired = remaining <= 0;
  const label = formatOfferAcceptLabel(remaining);

  return (
    <View style={[styles.wrap, expired && styles.wrapExpired, style]}>
      <Icon
        name={expired ? 'alert-circle-outline' : 'timer-outline'}
        size={14}
        color={expired ? '#DC2626' : '#0B8A80'}
      />
      <Text
        style={[styles.text, expired && styles.textExpired, textStyle]}
        numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  wrapExpired: {
    backgroundColor: '#FEECEC',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B8A80',
  },
  textExpired: {
    color: '#DC2626',
  },
});

export default OfferCountdown;
