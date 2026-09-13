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

/** Matches FamilyMemberDetails screen layout */
const FamilyDetailsSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Skeleton style={styles.profilePhoto} />
        <View style={styles.profileInfo}>
          <Skeleton style={styles.profileName} />
          <Skeleton style={styles.profileRelation} />
          <Skeleton style={styles.bloodBadge} />
        </View>
      </View>

      {/* Personal Information Section */}
      <View style={styles.section}>
        <Skeleton style={styles.sectionTitle} />
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <Skeleton style={styles.detailIcon} />
              <Skeleton style={styles.detailLabel} />
            </View>
            <Skeleton style={styles.detailValue} />
          </View>
        ))}
      </View>

      {/* Emergency Contact Section */}
      <View style={styles.section}>
        <Skeleton style={styles.sectionTitle} />
        <View style={styles.detailRow}>
          <View style={styles.detailRowLeft}>
            <Skeleton style={styles.detailIcon} />
            <Skeleton style={styles.detailLabel} />
          </View>
          <Skeleton style={styles.detailValue} />
        </View>
      </View>

      {/* Medical Information Section */}
      <View style={styles.section}>
        <Skeleton style={styles.sectionTitle} />
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <Skeleton style={styles.detailIcon} />
              <Skeleton style={styles.detailLabel} />
            </View>
            <Skeleton style={styles.detailValue} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  profilePhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    width: '60%',
    height: 22,
    borderRadius: 6,
    marginBottom: 6,
  },
  profileRelation: {
    width: '40%',
    height: 16,
    borderRadius: 4,
    marginBottom: 10,
  },
  bloodBadge: {
    width: 60,
    height: 24,
    borderRadius: 12,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    width: '45%',
    height: 18,
    borderRadius: 6,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
  },
  detailLabel: {
    width: '50%',
    height: 14,
    borderRadius: 4,
  },
  detailValue: {
    width: '35%',
    height: 14,
    borderRadius: 4,
  },
});

export default FamilyDetailsSkeleton;
