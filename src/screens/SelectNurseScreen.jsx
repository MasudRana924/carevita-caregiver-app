import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';
import AppInput from '../components/common/AppInput';

const nurses = [
  {
    id: 1,
    name: 'Sumaiya Begum',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    rating: '4.8',
    jobs: '87 jobs',
    experience: '3 yrs',
    distance: '2.1 km',
    price: '৳700',
    tags: ['Home Care', 'ICU'],
  },
  {
    id: 2,
    name: 'Nasrin Akter',
    image: 'https://randomuser.me/api/portraits/women/55.jpg',
    rating: '4.7',
    jobs: '65 jobs',
    experience: '2 yrs',
    distance: '3.5 km',
    price: '৳650',
    tags: ['Elderly', 'Recovery'],
  },
  {
    id: 3,
    name: 'Ruma Islam',
    image: 'https://randomuser.me/api/portraits/women/42.jpg',
    rating: '4.6',
    jobs: '54 jobs',
    experience: '2 yrs',
    distance: '1.9 km',
    price: '৳600',
    tags: ['Hospital', 'Pediatric'],
  },
  {
    id: 4,
    name: 'Khaleda Begum',
    image: 'https://randomuser.me/api/portraits/women/38.jpg',
    rating: '4.5',
    jobs: '42 jobs',
    experience: '1 yr',
    distance: '4.2 km',
    price: '৳550',
    tags: ['Post-Surgery', 'Dialysis'],
  },
];

const filters = [
  'Available',
  'Top Rated',
  'Female',
  'Nearby',
  'Budget',
];

const SelectNurseScreen = ({navigation}) => {
  const [selectedFilter, setSelectedFilter] = useState('Available');
  const [search, setSearch] = useState('');

  const filteredNurses = nurses.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header
        title="Select Nurse"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>
        {/* ================= SEARCH ================= */}

        <View style={styles.searchRow}>
          <AppInput
            icon="search-outline"
            value={search}
            onChangeText={setSearch}
            placeholder="Search nurses..."
            containerStyle={styles.searchInputWrap}
            inputRowStyle={styles.searchInputRow}
          />

          <TouchableOpacity activeOpacity={0.85} style={styles.filterButton}>
            <Icon name="options-outline" size={23} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ================= FILTER CHIPS ================= */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {filters.map(filter => {
            const selected = selectedFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.8}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterChip, selected && styles.filterChipActive]}>
                <Text style={[styles.filterText, selected && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ================= RESULT HEADER ================= */}

        <View style={styles.resultHeader}>
          <Text style={styles.availableText}>18 nurses available</Text>

          <TouchableOpacity activeOpacity={0.7} style={styles.sortButton}>
            <Icon name="swap-vertical" size={19} color="#1473DC" />

            <Text style={styles.sortText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* ================= NURSE LIST ================= */}

        <View style={styles.nurseList}>
          {filteredNurses.map(nurse => (
            <TouchableOpacity
              key={nurse.id}
              activeOpacity={0.9}
              style={styles.nurseCard}
              onPress={() => navigation?.navigate('NurseDetails', {nurse})}>
              {/* Avatar */}

              <View style={styles.avatarWrapper}>
                <Image source={{uri: nurse.image}} style={styles.avatar} />

                <View style={styles.verifiedBadge}>
                  <Icon name="checkmark" size={11} color="#FFFFFF" />
                </View>
              </View>

              {/* Main Information */}

              <View style={styles.nurseInfo}>
                <Text numberOfLines={1} style={styles.nurseName}>
                  {nurse.name}
                </Text>

                {/* Rating */}

                <View style={styles.ratingRow}>
                  <Icon name="star" size={17} color="#F6A900" />

                  <Text style={styles.rating}>{nurse.rating}</Text>

                  <Text style={styles.jobs}>({nurse.jobs})</Text>
                </View>

                {/* Experience / Distance / Available */}

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Icon
                      name="briefcase-outline"
                      size={14}
                      color="#7D8BA5"
                    />

                    <Text style={styles.metaText}>{nurse.experience}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Icon name="location-sharp" size={14} color="#7D8BA5" />

                    <Text style={styles.metaText}>{nurse.distance}</Text>
                  </View>

                  <View style={styles.availableBadge}>
                    <Text style={styles.availableBadgeText}>Available</Text>
                  </View>
                </View>

                {/* Tags */}

                <View style={styles.tagsRow}>
                  {nurse.tags.map(tag => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Price */}

              <View style={styles.priceContainer}>
                <Text style={styles.price}>{nurse.price}</Text>

                <Text style={styles.visit}>/visit</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SelectNurseScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  // =====================================================
  // SCROLL
  // =====================================================

  scrollContent: {
    paddingTop: 14,
    paddingHorizontal: 19,
    paddingBottom: 30,
  },

  // =====================================================
  // SEARCH
  // =====================================================

  searchRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputWrap: {
    flex: 1,
    marginBottom: 0,
  },
  searchInputRow: {
    marginBottom: 0,
  },
  filterButton: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: '#1473DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 9,
  },

  // =====================================================
  // FILTERS
  // =====================================================

  filterScroll: {
    paddingTop: 13,
    paddingBottom: 2,
    paddingRight: 10,
  },

  filterChip: {
    height: 36,
    borderRadius: 19,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  filterChipActive: {
    backgroundColor: '#008178',
    borderColor: '#008178',
  },

  filterText: {
    fontSize: 13,
    color: '#7D8BA5',
    fontWeight: '500',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  // =====================================================
  // RESULT HEADER
  // =====================================================

  resultHeader: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  availableText: {
    fontSize: 14,
    color: '#7D8BA5',
    fontWeight: '400',
  },

  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sortText: {
    color: '#1473DC',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 3,
  },

  // =====================================================
  // NURSE LIST
  // =====================================================

  nurseList: {
    width: '100%',
  },

  nurseCard: {
    width: '100%',
    minHeight: 126,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDE4EE',
    marginBottom: 14,
    paddingTop: 13,
    paddingBottom: 12,
    paddingLeft: 13,
    paddingRight: 12,
    flexDirection: 'row',
    position: 'relative',
  },

  // =====================================================
  // AVATAR
  // =====================================================

  avatarWrapper: {
    width: 66,
    height: 66,
    position: 'relative',
    marginRight: 10,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#E9EDF3',
  },

  verifiedBadge: {
    position: 'absolute',
    right: 0,
    top: -4,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#13B88A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // =====================================================
  // INFO
  // =====================================================

  nurseInfo: {
    flex: 1,
    minWidth: 0,
  },

  nurseName: {
    fontSize: 14.5,
    lineHeight: 19,
    color: '#182331',
    fontWeight: '700',
    paddingRight: 4,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    marginTop: 1,
  },

  rating: {
    fontSize: 13,
    color: '#182331',
    fontWeight: '600',
    marginLeft: 2,
  },

  jobs: {
    fontSize: 12,
    color: '#8190A7',
    marginLeft: 4,
  },

  // =====================================================
  // META
  // =====================================================

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },

  metaText: {
    fontSize: 11.5,
    color: '#8190A7',
    marginLeft: 2,
  },

  availableBadge: {
    height: 23,
    borderRadius: 6,
    paddingHorizontal: 9,
    backgroundColor: '#12B886',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 1,
  },

  availableBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },

  // =====================================================
  // TAGS
  // =====================================================

  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  tag: {
    height: 21,
    borderRadius: 5,
    paddingHorizontal: 7,
    backgroundColor: '#EAF2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },

  tagText: {
    fontSize: 10.5,
    color: '#1473DC',
    fontWeight: '500',
  },

  // =====================================================
  // PRICE
  // =====================================================

  priceContainer: {
    position: 'absolute',
    right: 13,
    top: 14,
    alignItems: 'flex-end',
  },

  price: {
    fontSize: 17,
    lineHeight: 21,
    color: '#1473DC',
    fontWeight: '700',
  },

  visit: {
    fontSize: 12,
    lineHeight: 18,
    color: '#8190A7',
    fontWeight: '400',
  },
});
