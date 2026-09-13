import React from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const Skeleton = ({style}) => (
  <LinearGradient
    colors={['#E5E7EB', '#F3F4F6', '#E5E7EB']}
    start={{x: 0, y: 0}}
    end={{x: 1, y: 0}}
    style={[styles.skeleton, style]}
  />
);

/** Matches SelectCaregiverScreen card layout */
const CaregiverSkeleton = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              <Skeleton style={styles.avatar} />
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Skeleton style={styles.name} />
                <Skeleton style={styles.badge} />
              </View>
              <Skeleton style={styles.infoRow} />
              <Skeleton style={styles.infoRowShort} />
            </View>
          </View>

          <Skeleton style={styles.bio} />

          <View style={styles.cardFooter}>
            <Skeleton style={styles.price} />
            <Skeleton style={styles.selectPill} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  card: {
    width: '100%',
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: '#F6F6F6',
    marginBottom: 12,
  },
  cardHeader: {
    width: '100%',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 58,
    height: 58,
    marginRight: 13,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  userInfo: {
    flex: 1,
    paddingTop: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    height: 18,
    borderRadius: 6,
    marginRight: 8,
  },
  badge: {
    width: 64,
    height: 22,
    borderRadius: 11,
  },
  infoRow: {
    width: '80%',
    height: 12,
    borderRadius: 4,
    marginBottom: 6,
  },
  infoRowShort: {
    width: '60%',
    height: 12,
    borderRadius: 4,
  },
  bio: {
    width: '100%',
    height: 36,
    borderRadius: 8,
    marginTop: 12,
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    width: 90,
    height: 22,
    borderRadius: 6,
  },
  selectPill: {
    width: 88,
    height: 40,
    borderRadius: 12,
  },
});

export default CaregiverSkeleton;
