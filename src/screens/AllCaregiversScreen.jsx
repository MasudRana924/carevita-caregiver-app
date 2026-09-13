import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSearchCaregivers} from '../api/queries';
import Header from '../components/common/Header';

const AllCaregiversScreen = ({navigation}) => {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [gender, setGender] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');

  const filters = [
    {id: 'all', label: 'All'},
    {id: 'male', label: 'Male'},
    {id: 'female', label: 'Female'},
  ];

  const {data: caregiversData, isLoading} = useSearchCaregivers({
    name: search,
    location,
    gender: selectedFilter === 'all' ? '' : selectedFilter,
  });

  const caregivers = Array.isArray(caregiversData?.data)
    ? caregiversData.data
    : [];

  const handleFilterSelect = (filterId) => {
    setSelectedFilter(filterId === selectedFilter ? '' : filterId);
  };

  const handleSearch = (text) => {
    setSearch(text);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="All Caregivers" onBack={() => navigation?.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>
        {/* ================= SEARCH ================= */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={23} color="#7D8BA5" />
            <TextInput
              value={search}
              onChangeText={handleSearch}
              placeholder="Search by name..."
              placeholderTextColor="#7D8BA5"
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="options-outline" size={22} color="#1473DC" />
          </TouchableOpacity>
        </View>

        {/* Location Filter */}
        <View style={styles.locationFilter}>
          <Icon name="location-outline" size={18} color="#7D8BA5" />
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Filter by location..."
            placeholderTextColor="#7D8BA5"
            style={styles.locationInput}
          />
        </View>

        {/* ================= FILTERS ================= */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              activeOpacity={0.75}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.activeFilter,
              ]}
              onPress={() => handleFilterSelect(filter.id)}>
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.activeFilterText,
                ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ================= CAREGIVER LIST ================= */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : caregivers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={64} color="#E3E8F0" />
            <Text style={styles.emptyTitle}>No Caregivers Found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        ) : (
          <View style={styles.caregiverList}>
            {caregivers.map(caregiver => (
              <TouchableOpacity
                key={caregiver.id}
                activeOpacity={0.9}
                style={styles.caregiverCard}
                onPress={() =>
                  navigation?.navigate('CaregiverDetails', {caregiver})
                }>
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    {caregiver.profile_photo ? (
                      <Image source={{uri: caregiver.profile_photo}} style={styles.avatar} />
                    ) : (
                      <View style={styles.iconContainer}>
                        <Icon name="person" size={24} color="#008178" />
                      </View>
                    )}
                  </View>

                  <View style={styles.cardRight}>
                    <View style={styles.nameRow}>
                      <Text style={styles.caregiverName}>
                        {caregiver.name || 'Caregiver'}
                      </Text>
                      {caregiver.is_available && (
                        <View style={styles.availableBadge}>
                          <Text style={styles.availableBadgeText}>Available</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.locationText}>
                      {caregiver.experience_years} yrs exp ·{' '}
                      {[caregiver.thana, caregiver.district]
                        .filter(Boolean)
                        .join(', ') ||
                        caregiver.service_areas?.join(', ') ||
                        'No location'}
                    </Text>
                    <Text style={styles.priceText}>৳{caregiver.hourly_rate}/hr</Text>
                  </View>

                  <View style={styles.ratingSection}>
                    <Text style={styles.ratingText}>{caregiver.rating}</Text>
                    <Icon name="star" size={16} color="#F6A900" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AllCaregiversScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ================= LOADING =================
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  loadingText: {
    fontSize: 16,
    color: '#8190A7',
  },

  // ================= EMPTY STATE =================
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#172333',
    marginTop: 16,
  },

  emptyText: {
    fontSize: 14,
    color: '#8190A7',
    marginTop: 8,
  },

  // =====================================================
  // SEARCH
  // =====================================================

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },

  searchBox: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#172333',
  },

  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#E9F1FC',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ================= LOCATION FILTER =================
  locationFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
  },

  locationInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#172333',
  },

  // =====================================================
  // FILTERS
  // =====================================================

  filtersScroll: {
    marginTop: 16,
    marginBottom: 20,
  },

  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    marginRight: 8,
  },

  activeFilter: {
    backgroundColor: '#008178',
  },

  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8190A7',
  },

  activeFilterText: {
    color: '#FFFFFF',
  },

  // =====================================================
  // CAREGIVER LIST
  // =====================================================

  caregiverList: {
    flexDirection: 'column',
  },

  caregiverCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3E8F0',
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  cardLeft: {
    marginRight: 12,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EAF2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  cardRight: {
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  caregiverName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#172333',
    marginRight: 8,
  },

  availableBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  availableBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#19B57A',
  },

  locationText: {
    fontSize: 13,
    color: '#8190A7',
  },

  priceText: {
    fontSize: 13,
    color: '#008178',
    fontWeight: '600',
    marginTop: 2,
  },

  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },

  ratingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#172333',
    marginRight: 4,
  },

  // =====================================================
  // SCROLL
  // =====================================================

  scrollContent: {
    paddingTop: 14,
    paddingHorizontal: 19,
    paddingBottom: 30,
  },
});
