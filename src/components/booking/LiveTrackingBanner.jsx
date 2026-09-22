import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {subscribeTracking} from '../../services/liveTrackingService';

/**
 * Small status banner while caregiver GPS is being shared.
 * Does not show user/family location.
 */
const LiveTrackingBanner = ({forceVisible = false}) => {
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    return subscribeTracking(state => {
      setSharing(Boolean(state?.isSharing));
    });
  }, []);

  if (!forceVisible && !sharing) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.dot} />
      <Icon name="navigate" size={16} color="#0B8A80" />
      <Text style={styles.text}>Live location sharing ON</Text>
    </View>
  );
};

export default LiveTrackingBanner;

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E6F7F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B7E5DA',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0B8A80',
  },
});
