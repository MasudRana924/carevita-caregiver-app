import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useCaregiver} from '../api/queries';

const CaregiverDetailsScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const routeCaregiver = route?.params?.caregiver || {};
  const caregiverId = routeCaregiver.id || route?.params?.caregiverId;
  const shouldFetch =
    typeof caregiverId === 'string' && caregiverId.length > 10;

  const {data: caregiverResponse} = useCaregiver(shouldFetch ? caregiverId : null);
  const apiCaregiver = caregiverResponse?.data || {};

  const hourlyRate =
    apiCaregiver.hourly_rate ||
    routeCaregiver.hourly_rate ||
    routeCaregiver.price;
  const photo =
    apiCaregiver.profile_photo ||
    routeCaregiver.profile_photo ||
    routeCaregiver.image;

  const caregiver = {
    name: 'Rahim Ahmed',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: '4.9',
    jobs: '142 jobs',
    experience: '4 yrs',
    price: '৳800',
    ...routeCaregiver,
    ...apiCaregiver,
    name:
      apiCaregiver.name ||
      routeCaregiver.name ||
      'Caregiver',
    image: photo || 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: apiCaregiver.rating ?? routeCaregiver.rating ?? '—',
    jobs:
      routeCaregiver.jobs ||
      (apiCaregiver.completed_bookings != null
        ? `${apiCaregiver.completed_bookings} jobs`
        : '—'),
    experience:
      routeCaregiver.experience ||
      (apiCaregiver.experience_years != null
        ? `${apiCaregiver.experience_years} yrs`
        : '—'),
    price: hourlyRate ? `৳${hourlyRate}` : routeCaregiver.price || '৳800',
    bio: apiCaregiver.bio || routeCaregiver.bio,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.backButton}
          onPress={() => navigation?.goBack()}>
          <Icon name="arrow-back" size={22} color="#182331" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.shareButton}>
          <Icon name="share-outline" size={20} color="#182331" />
        </TouchableOpacity>
      </View>

      {/* =====================================================
          PAGE
      ===================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* =================================================
            PROFILE
        ================================================= */}

        <View style={styles.profileSection}>
          {/* Profile image */}

          <View style={styles.profileImageWrapper}>
            <Image source={{uri: caregiver.image}} style={styles.profileImage} />

            <View style={styles.verifiedIcon}>
              <Icon name="checkmark" size={11} color="#FFFFFF" />
            </View>
          </View>

          {/* Profile information */}

          <View style={styles.profileInfo}>
            <Text numberOfLines={1} style={styles.caregiverName}>
              {caregiver.name}
            </Text>

            <Text style={styles.caregiverRole}>
              Hospital Attendant & Caregiver
            </Text>

            {/* Rating */}

            <View style={styles.ratingRow}>
              <View style={styles.stars}>
                <Icon name="star-outline" size={14} color="#F2A500" />
                <Icon name="star-outline" size={14} color="#F2A500" />
                <Icon name="star-outline" size={14} color="#F2A500" />
                <Icon name="star-outline" size={14} color="#F2A500" />
                <Icon name="star-outline" size={14} color="#F2A500" />
              </View>

              <Text style={styles.ratingNumber}>{caregiver.rating}</Text>

              <Text style={styles.jobCount}>({caregiver.jobs})</Text>
            </View>

            {/* Verification badges */}

            <View style={styles.verificationRow}>
              <View style={styles.verificationBadge}>
                <Icon name="shield-checkmark" size={12} color="#FFFFFF" />

                <Text style={styles.verificationText}>ID Verified</Text>
              </View>

              <View style={styles.verificationBadge}>
                <Icon name="shield-checkmark" size={12} color="#FFFFFF" />

                <Text style={styles.verificationText}>Background Checked</Text>
              </View>
            </View>
          </View>
        </View>

        {/* =================================================
            STATS
        ================================================= */}

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>142</Text>

            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>4 yrs</Text>

            <Text style={styles.statLabel}>Experience</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.satisfaction]}>98%</Text>

            <Text style={styles.statLabel}>Satisfaction</Text>
          </View>
        </View>

        {/* =================================================
            ABOUT
        ================================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <Text style={styles.aboutText}>
            {caregiver.bio ||
              'Experienced hospital attendant with 4 years of service across major Dhaka hospitals. Speaks Bengali and basic English. Calm, trustworthy and patient-focused.'}
          </Text>
        </View>

        {/* =================================================
            SKILLS
        ================================================= */}

        <View style={styles.sectionSkills}>
          <Text style={styles.sectionTitle}>Skills</Text>

          <View style={styles.skillsContainer}>
            <Skill title="Hospital Visit" />
            <Skill title="Elderly Companion" />
            <Skill title="Wheelchair Assist" />
            <Skill title="Registration" />
            <Skill title="Billing Help" />
            <Skill title="Medicine Pickup" />
          </View>
        </View>

        {/* =================================================
            AVAILABILITY & PRICING
        ================================================= */}

        <View style={styles.pricingCard}>
          <View style={styles.pricingHeader}>
            <Text style={styles.pricingTitle}>Availability & Pricing</Text>

            <View style={styles.availableToday}>
              <Text style={styles.availableTodayText}>Available Today</Text>
            </View>
          </View>

          <View style={styles.pricingItems}>
            <PriceItem title="Half Day (4 hrs)" price="৳800" />
            <PriceItem title="Full Day (8 hrs)" price="৳1,400" />
            <PriceItem title="Overnight" price="৳2,000" />
          </View>
        </View>

        {/* =================================================
            REVIEWS
        ================================================= */}

        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Reviews</Text>

          <View style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <View>
                <Text style={styles.reviewerName}>Nadia R.</Text>

                <View style={styles.reviewStars}>
                  <Icon name="star-outline" size={14} color="#F2A500" />
                  <Icon name="star-outline" size={14} color="#F2A500" />
                  <Icon name="star-outline" size={14} color="#F2A500" />
                  <Icon name="star-outline" size={14} color="#F2A500" />
                  <Icon name="star-outline" size={14} color="#F2A500" />
                </View>
              </View>

              <Text style={styles.reviewDate}>2 days ago</Text>
            </View>

            <Text style={styles.reviewText}>
              Rahim was punctual, caring and handled everything at the hospital perfectly.
            </Text>

            <Text style={styles.reviewTextBottom}>
              My father felt comfortable and safe. Highly recommend!
            </Text>
          </View>
        </View>

        {/* Bottom spacing for fixed button */}
        <View style={[styles.bottomSpace, {height: 65 + insets.bottom}]} />
      </ScrollView>

      {/* =====================================================
          FIXED BOOK BUTTON
      ===================================================== */}

      <View style={[styles.bottomBar, {bottom: insets.bottom}]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.bookButton}
          onPress={() => navigation?.navigate('SelectFamilyMember', {selectedCaregiver: caregiver})}>
          <Icon name="calendar-outline" size={19} color="#FFFFFF" />

          <Text style={styles.bookButtonText}>Book {caregiver.name} — {caregiver.price}/visit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/* =========================================================
   SKILL
========================================================= */

const Skill = ({title}) => {
  return (
    <View style={styles.skillChip}>
      <Text style={styles.skillText}>{title}</Text>
    </View>
  );
};

/* =========================================================
   PRICE ITEM
========================================================= */

const PriceItem = ({title, price}) => {
  return (
    <View style={styles.priceItem}>
      <Text style={styles.priceTitle}>{title}</Text>

      <Text style={styles.priceValue}>{price}</Text>
    </View>
  );
};

export default CaregiverDetailsScreen;

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  // =======================================================
  // HEADER
  // =======================================================

  header: {
    height: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
  },

  backButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E9EEF5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  shareButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // =======================================================
  // SCROLL
  // =======================================================

  scrollContent: {
    paddingTop: 7,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },

  // =======================================================
  // PROFILE
  // =======================================================

  profileSection: {
    flexDirection: 'row',
    minHeight: 70,
  },

  profileImageWrapper: {
    width: 70,
    height: 70,
    position: 'relative',
    marginRight: 14,
  },

  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 15,
    backgroundColor: '#E4E9EF',
  },

  verifiedIcon: {
    position: 'absolute',
    right: -3,
    top: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#12B88A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileInfo: {
    flex: 1,
    paddingTop: 1,
  },

  caregiverName: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: '#182331',
  },

  caregiverRole: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#8190A7',
    marginTop: 1,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 18,
    marginTop: 1,
  },

  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingNumber: {
    fontSize: 11.5,
    color: '#182331',
    fontWeight: '700',
    marginLeft: 4,
  },

  jobCount: {
    fontSize: 10.5,
    color: '#8190A7',
    marginLeft: 3,
  },

  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  verificationBadge: {
    height: 19,
    borderRadius: 5,
    backgroundColor: '#12B88A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginRight: 4,
  },

  verificationText: {
    fontSize: 8.5,
    lineHeight: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 2,
  },

  // =======================================================
  // STATS
  // =======================================================

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  statCard: {
    width: '31.8%',
    height: 59,
    borderRadius: 18,
    backgroundColor: '#F0F3F8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statNumber: {
    fontSize: 16,
    lineHeight: 20,
    color: '#182331',
    fontWeight: '700',
  },

  satisfaction: {
    color: '#12B88A',
  },

  statLabel: {
    fontSize: 9,
    lineHeight: 13,
    color: '#8190A7',
    marginTop: 1,
  },

  // =======================================================
  // ABOUT
  // =======================================================

  section: {
    marginTop: 15,
  },

  sectionTitle: {
    fontSize: 13.5,
    lineHeight: 18,
    color: '#182331',
    fontWeight: '700',
  },

  aboutText: {
    fontSize: 11,
    lineHeight: 19,
    color: '#8190A7',
    marginTop: 7,
  },

  // =======================================================
  // SKILLS
  // =======================================================

  sectionSkills: {
    marginTop: 16,
  },

  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 7,
  },

  skillChip: {
    height: 27,
    borderRadius: 14,
    backgroundColor: '#EAF2FE',
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 6,
  },

  skillText: {
    fontSize: 10,
    color: '#1473DC',
    fontWeight: '500',
  },

  // =======================================================
  // PRICING
  // =======================================================

  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E1E6EE',
    marginTop: 11,
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 11,
  },

  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pricingTitle: {
    fontSize: 13.5,
    lineHeight: 18,
    color: '#182331',
    fontWeight: '700',
  },

  availableToday: {
    height: 21,
    borderRadius: 11,
    backgroundColor: '#12B88A',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  availableTodayText: {
    fontSize: 8.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  pricingItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  priceItem: {
    width: '33.33%',
  },

  priceTitle: {
    fontSize: 9.5,
    lineHeight: 14,
    color: '#8190A7',
  },

  priceValue: {
    fontSize: 14,
    lineHeight: 19,
    color: '#182331',
    fontWeight: '700',
    marginTop: 1,
  },

  // =======================================================
  // REVIEWS
  // =======================================================

  reviewsSection: {
    marginTop: 17,
  },

  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#DEE5EE',
    marginTop: 8,
    padding: 11,
  },

  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  reviewerName: {
    fontSize: 11,
    lineHeight: 15,
    color: '#182331',
    fontWeight: '700',
  },

  reviewStars: {
    flexDirection: 'row',
    marginTop: 1,
  },

  reviewDate: {
    fontSize: 9,
    color: '#8190A7',
  },

  reviewText: {
    fontSize: 10.5,
    lineHeight: 16,
    color: '#8190A7',
    marginTop: 3,
  },

  reviewTextBottom: {
    fontSize: 10.5,
    lineHeight: 16,
    color: '#8190A7',
    marginTop: 4,
  },

  // =======================================================
  // BOTTOM SPACE
  // =======================================================

  bottomSpace: {
    height: 65,
  },

  // =======================================================
  // FIXED BOOK BUTTON
  // =======================================================

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFF',
    paddingTop: 9,
  },

  bookButton: {
    width: '100%',
    height: 60,
    borderRadius: 14,
    backgroundColor: '#008178',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
});
