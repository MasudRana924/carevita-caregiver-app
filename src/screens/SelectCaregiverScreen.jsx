import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSearchCaregivers} from '../api/queries';
import Header from '../components/common/Header';
import CaregiverSkeleton from '../components/home/CaregiverSkeleton';
import {storage} from '../utils/storage';

const SelectCaregiverScreen = ({navigation, route}) => {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const {
    selectedMember,
    selectedService,
    district = '',
    thana = '',
    selectedArea,
    serviceType = 'caregiver',
  } = route.params || {};

  const selectedDistrict = district || selectedArea?.district || '';
  const selectedThana = thana || selectedArea?.thana || '';

  const filters = [
    {id: 'all', label: 'All'},
    {id: 'male', label: 'Male'},
    {id: 'female', label: 'Female'},
  ];

  const {data: caregiversData, isLoading} = useSearchCaregivers({
    name: search,
    district: selectedDistrict,
    thana: selectedThana,
    gender: selectedFilter === 'all' ? '' : selectedFilter,
  });

  const caregivers = Array.isArray(caregiversData?.data)
    ? caregiversData.data
    : [];

  const handleFilterSelect = filterId => {
    setSelectedFilter(filterId === selectedFilter ? '' : filterId);
  };

  const handleSearch = text => {
    setSearch(text);
  };

  const handleNext = () => {
    if (selectedCaregiver) {
      storage.saveSelectedCaregiver(selectedCaregiver);
      navigation?.navigate('HospitalSelection', {
        selectedMember,
        selectedCaregiver,
        selectedService,
        selectedArea: selectedArea || {
          district: selectedDistrict,
          thana: selectedThana,
        },
        serviceType,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="Select Caregiver" onBack={() => navigation?.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>
        {/* ================= SEARCH ================= */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={20} color="#8190A7" />
            <TextInput
              value={search}
              onChangeText={handleSearch}
              placeholder="Search by name..."
              placeholderTextColor="#8190A7"
              style={styles.searchInput}
            />
          </View>
        </View>

        {(!!selectedDistrict || !!selectedThana) && (
          <View style={styles.areaBanner}>
            <Icon name="location-outline" size={16} color="#008178" />
            <Text style={styles.areaBannerText} numberOfLines={1}>
              {[selectedThana, selectedDistrict].filter(Boolean).join(', ')}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation?.goBack()}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.changeAreaText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= FILTER CHIPS ================= */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {filters.map(filter => {
            const selected = selectedFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                activeOpacity={0.8}
                onPress={() => handleFilterSelect(filter.id)}
                style={[styles.filterChip, selected && styles.filterChipActive]}>
                <Text
                  style={[styles.filterText, selected && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ================= RESULT HEADER ================= */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultCount}>
            {caregivers.length} caregivers available
          </Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.sortButton}>
            <Icon name="swap-vertical" size={18} color="#008178" />
            <Text style={styles.sortText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* ================= CAREGIVER LIST ================= */}
        {isLoading ? (
          <CaregiverSkeleton />
        ) : caregivers.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="people-outline" size={32} color="#008178" />
            </View>
            <Text style={styles.emptyTitle}>No caregiver found</Text>
            <Text style={styles.emptyText}>
              No caregivers are available in{' '}
              {[selectedThana, selectedDistrict].filter(Boolean).join(', ') ||
                'this area'}
              . Try another district or thana.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.changeAreaButton}
              onPress={() => navigation?.goBack()}>
              <Text style={styles.changeAreaButtonText}>Change area</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.caregiverList}>
            {caregivers.map(caregiver => {
              const isSelected = selectedCaregiver?.id === caregiver.id;
              const rate = caregiver.hourly_rate ?? caregiver.price;

              return (
                <TouchableOpacity
                  key={caregiver.id}
                  activeOpacity={0.85}
                  style={[
                    styles.caregiverCard,
                    isSelected && styles.selectedCard,
                  ]}
                  onPress={() => setSelectedCaregiver(caregiver)}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                      {caregiver.profile_photo ? (
                        <Image
                          source={{uri: caregiver.profile_photo}}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.placeholderAvatar}>
                          <Icon name="person" size={24} color="#8190A7" />
                        </View>
                      )}
                      {caregiver.is_available && (
                        <View style={styles.onlineDot} />
                      )}
                    </View>

                    <View style={styles.userInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.name} numberOfLines={1}>
                          {caregiver.name || 'Caregiver'}
                        </Text>
                        {caregiver.is_available && (
                          <View style={styles.availableBadge}>
                            <Text style={styles.availableBadgeText}>
                              Available
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.infoRow}>
                        <Icon name="star" size={14} color="#F59E0B" />
                        <Text style={styles.infoText}>
                          {caregiver.rating ?? '—'}
                          {caregiver.completed_bookings != null
                            ? ` (${caregiver.completed_bookings})`
                            : ''}
                          {' · '}
                          {caregiver.experience_years ?? 0} yrs exp
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Icon name="location-outline" size={14} color="#303944" />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {[caregiver.thana, caregiver.district]
                            .filter(Boolean)
                            .join(', ') ||
                            caregiver.service_areas?.join(', ') ||
                            'No location'}
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Icon
                          name="checkmark-circle"
                          size={24}
                          color="#008178"
                        />
                      </View>
                    )}
                  </View>

                  {!!caregiver.bio && (
                    <Text style={styles.bioText} numberOfLines={2}>
                      {caregiver.bio}
                    </Text>
                  )}

                  <View style={styles.cardFooter}>
                    {rate != null && rate !== '' ? (
                      <View style={styles.priceBlock}>
                        <Text style={styles.price}>
                          ৳{rate}
                          <Text style={styles.perHour}> / hr</Text>
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.priceBlock} />
                    )}

                    <View
                      style={[
                        styles.selectPill,
                        isSelected && styles.selectPillActive,
                      ]}>
                      <Text
                        style={[
                          styles.selectPillText,
                          isSelected && styles.selectPillTextActive,
                        ]}>
                        {isSelected ? 'Selected' : 'Select'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.nextButton,
            !selectedCaregiver && styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={!selectedCaregiver}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SelectCaregiverScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  searchRow: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
    paddingVertical: 0,
    color: '#172333',
    fontSize: 15,
  },

  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  locationFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E8F0',
  },

  locationInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#172333',
  },

  areaBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },

  areaBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#008178',
  },

  changeAreaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#008178',
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  changeAreaButton: {
    marginTop: 18,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
  },

  changeAreaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  filterScroll: {
    paddingTop: 14,
    paddingBottom: 4,
    paddingRight: 10,
  },

  filterChip: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  filterChipActive: {
    backgroundColor: '#008178',
    borderColor: '#008178',
  },

  filterText: {
    fontSize: 13,
    color: '#8190A7',
    fontWeight: '500',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  resultHeader: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resultCount: {
    fontSize: 13,
    color: '#8190A7',
    fontWeight: '400',
  },

  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sortText: {
    color: '#008178',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 3,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  loadingText: {
    fontSize: 16,
    color: '#8190A7',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111820',
    marginTop: 16,
  },

  emptyText: {
    fontSize: 14,
    color: '#8190A7',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  caregiverList: {
    flexDirection: 'column',
  },

  caregiverCard: {
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

  selectedCard: {
    borderWidth: 2,
    borderColor: '#008178',
    backgroundColor: '#FFFFFF',
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
    position: 'relative',
    marginRight: 13,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E5E5E5',
  },

  placeholderAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E3E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#13C875',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  userInfo: {
    flex: 1,
    paddingTop: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },

  name: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#111820',
    marginRight: 8,
  },

  availableBadge: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: '#E6F4F3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  availableBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    color: '#008178',
    fontWeight: '600',
  },

  infoRow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },

  infoText: {
    marginLeft: 5,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400',
    color: '#303944',
  },

  selectedBadge: {
    marginLeft: 8,
    marginTop: 2,
  },

  bioText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: '#8190A7',
  },

  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  priceBlock: {
    flex: 1,
  },

  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111820',
  },

  perHour: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8190A7',
  },

  selectPill: {
    minWidth: 88,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectPillActive: {
    backgroundColor: '#008178',
  },

  selectPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008178',
  },

  selectPillTextActive: {
    color: '#FFFFFF',
  },

  bottomContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  nextButton: {
    backgroundColor: '#008178',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },

  disabledButton: {
    backgroundColor: '#B5C0D0',
  },

  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
