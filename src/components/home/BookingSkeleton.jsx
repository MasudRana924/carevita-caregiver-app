import React from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const Skeleton = ({style}) => {
  return (
    <LinearGradient
      colors={['#E5E7EB', '#F3F4F6', '#E5E7EB']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={[styles.skeleton, style]}
    />
  );
};

const BookingSkeleton = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <View style={styles.bookingInfo}>
                <Skeleton style={styles.bookingIdLabel} />
                <Skeleton style={styles.bookingId} />
              </View>
              <View style={styles.dateInfo}>
                <Skeleton style={styles.dateIcon} />
                <Skeleton style={styles.dateText} />
              </View>
            </View>
            <Skeleton style={styles.rightArrow} />
          </View>
          <View style={styles.paymentBadgeContainer}>
            <Skeleton style={styles.paymentBadge} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E3E8F0',
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'column',
    flex: 1,
  },
  bookingInfo: {
    marginBottom: 6,
  },
  bookingIdLabel: {
    width: 70,
    height: 12,
    borderRadius: 4,
    marginBottom: 4,
  },
  bookingId: {
    width: 120,
    height: 16,
    borderRadius: 4,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  dateText: {
    width: 100,
    height: 14,
    borderRadius: 4,
    marginLeft: 6,
  },
  rightArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  paymentBadgeContainer: {
    marginTop: 8,
  },
  paymentBadge: {
    width: 50,
    height: 20,
    borderRadius: 10,
  },
});

export default BookingSkeleton;
