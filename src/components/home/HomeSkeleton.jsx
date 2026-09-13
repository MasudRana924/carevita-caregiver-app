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

const HomeSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <Skeleton style={styles.profileImage} />
        <View style={styles.greetingBlock}>
          <Skeleton style={styles.greeting} />
          <Skeleton style={styles.userName} />
        </View>
        <Skeleton style={styles.notificationButton} />
      </View>

      {/* Active Booking Card Skeleton */}
      <View style={styles.bookingCard}>
        <Skeleton style={styles.statusBadge} />
        <Skeleton style={styles.bookingTitle} />
        <Skeleton style={styles.bookingInfo} />
        <Skeleton style={styles.trackButton} />
      </View>

      {/* Booking Buttons Skeleton */}
      <View style={styles.bookingButtons}>
        <Skeleton style={styles.bookingButton} />
        <Skeleton style={styles.bookingButton} />
      </View>

      {/* Quick Services Skeleton */}
      {/*
      <View style={styles.sectionHeader}>
        <Skeleton style={styles.sectionTitle} />
      </View>
      <View style={styles.servicesGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <View key={i} style={styles.serviceItem}>
            <Skeleton style={styles.serviceIcon} />
            <Skeleton style={styles.serviceText} />
          </View>
        ))}
      </View>
      */}

      {/* Top Caregivers Skeleton */}
      {/*
      <View style={styles.sectionHeader}>
        <Skeleton style={styles.sectionTitle} />
        <Skeleton style={styles.seeAll} />
      </View>
      <View style={styles.caregiverScroll}>
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.caregiverCard}>
            <Skeleton style={styles.caregiverImage} />
            <Skeleton style={styles.caregiverName} />
            <Skeleton style={styles.caregiverSpecialty} />
            <View style={styles.caregiverBottom}>
              <Skeleton style={styles.caregiverPrice} />
              <Skeleton style={styles.caregiverButton} />
            </View>
          </View>
        ))}
      </View>
      */}

      {/* Available Nurses / Top Nurses Skeleton */}
      {/*
      <View style={styles.sectionHeader}>
        <Skeleton style={styles.sectionTitle} />
        <Skeleton style={styles.seeAll} />
      </View>
      <View style={styles.caregiverScroll}>
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.caregiverCard}>
            <Skeleton style={styles.caregiverImage} />
            <Skeleton style={styles.caregiverName} />
            <Skeleton style={styles.caregiverSpecialty} />
            <View style={styles.caregiverBottom}>
              <Skeleton style={styles.caregiverPrice} />
              <Skeleton style={styles.caregiverButton} />
            </View>
          </View>
        ))}
      </View>
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 85,
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  // Header
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  greetingBlock: {
    flex: 1,
    marginLeft: 10,
  },
  greeting: {
    width: 120,
    height: 17,
    borderRadius: 4,
    marginBottom: 4,
  },
  userName: {
    width: 100,
    height: 23,
    borderRadius: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  // Booking Card
  bookingCard: {
    backgroundColor: '#0f766e',
    borderRadius: 20,
    padding: 18,
    marginTop: 14,
  },
  statusBadge: {
    width: 80,
    height: 16,
    borderRadius: 8,
  },
  bookingTitle: {
    width: 180,
    height: 24,
    borderRadius: 4,
    marginTop: 8,
  },
  bookingInfo: {
    width: 200,
    height: 16,
    borderRadius: 4,
    marginTop: 8,
  },
  trackButton: {
    width: 100,
    height: 36,
    borderRadius: 12,
    marginTop: 16,
  },
  // Booking Buttons
  bookingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  bookingButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    width: 120,
    height: 20,
    borderRadius: 4,
  },
  seeAll: {
    width: 50,
    height: 14,
    borderRadius: 4,
  },
  // Quick Services
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: '24%',
    alignItems: 'center',
    marginBottom: 9,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  serviceText: {
    width: 50,
    height: 12,
    borderRadius: 4,
    marginTop: 5,
  },
  // Caregiver Cards
  caregiverScroll: {
    flexDirection: 'row',
    paddingRight: 5,
  },
  caregiverCard: {
    width: 170,
    backgroundColor: '#F6F8FA',
    borderRadius: 16,
    paddingBottom: 14,
    marginRight: 12,
  },
  caregiverImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  caregiverName: {
    width: 120,
    height: 18,
    borderRadius: 4,
    marginTop: 10,
    marginLeft: 12,
  },
  caregiverSpecialty: {
    width: 100,
    height: 14,
    borderRadius: 4,
    marginTop: 2,
    marginLeft: 12,
  },
  caregiverBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 10,
  },
  caregiverPrice: {
    width: 60,
    height: 20,
    borderRadius: 4,
  },
  caregiverButton: {
    width: 70,
    height: 28,
    borderRadius: 14,
  },
});

export default HomeSkeleton;
