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

/** Matches SelectFamilyMember / FamilyScreen card layout */
const FamilySkeleton = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <View style={styles.avatarContainer}>
                <Skeleton style={styles.avatar} />
              </View>
              <View style={styles.userInfo}>
                <Skeleton style={styles.name} />
                <Skeleton style={styles.relation} />
              </View>
            </View>
            <Skeleton style={styles.rightArrow} />
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    width: '70%',
    height: 18,
    borderRadius: 6,
    marginBottom: 6,
  },
  relation: {
    width: '45%',
    height: 14,
    borderRadius: 4,
  },
  rightArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});

export default FamilySkeleton;
