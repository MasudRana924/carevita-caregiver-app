import React from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const Skeleton = ({style}) => {
  return (
    <LinearGradient
      colors={['#E8ECF1', '#F3F5F8', '#E8ECF1']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={[styles.skeleton, style]}
    />
  );
};

const BookingDetailsSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.heroTop}>
          <View>
            <Skeleton style={styles.amountLabel} />
            <Skeleton style={styles.amount} />
          </View>
          <Skeleton style={styles.status} />
        </View>
        <View style={styles.divider} />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <View key={i} style={styles.infoRow}>
            <Skeleton style={styles.infoLabel} />
            <Skeleton style={styles.infoValue} />
          </View>
        ))}
      </View>

      {[1, 2, 3].map(i => (
        <View key={i} style={styles.card}>
          <Skeleton style={styles.sectionTitle} />
          <View style={styles.personRow}>
            <Skeleton style={styles.avatar} />
            <View style={styles.personInfo}>
              <Skeleton style={styles.name} />
              <Skeleton style={styles.meta} />
              <Skeleton style={styles.metaShort} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default BookingDetailsSkeleton;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  skeleton: {
    backgroundColor: '#E8ECF1',
  },
  card: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  amountLabel: {
    width: 80,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  amount: {
    width: 110,
    height: 28,
    borderRadius: 8,
  },
  status: {
    width: 88,
    height: 28,
    borderRadius: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    width: 90,
    height: 14,
    borderRadius: 6,
  },
  infoValue: {
    width: 120,
    height: 14,
    borderRadius: 6,
  },
  sectionTitle: {
    width: 90,
    height: 14,
    borderRadius: 6,
    marginBottom: 12,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  personInfo: {
    flex: 1,
  },
  name: {
    width: 130,
    height: 16,
    borderRadius: 6,
    marginBottom: 8,
  },
  meta: {
    width: 160,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  metaShort: {
    width: 100,
    height: 12,
    borderRadius: 6,
  },
});
