import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSearchHospitals} from '../api/queries';
import Header from '../components/common/Header';
import HospitalSkeleton from '../components/home/HospitalSkeleton';
import SearchableDropdown from '../components/common/SearchableDropdown';
import {bangladeshDistricts, bangladeshCities} from '../data/bangladeshLocations';
import {storage} from '../utils/storage';

const HospitalSelection = ({navigation, route}) => {
  const {selectedMember, selectedCaregiver, selectedService, selectedArea, serviceType} =
    route.params || {};
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [district, setDistrict] = useState(selectedArea?.district || '');
  const [city, setCity] = useState(selectedArea?.thana || '');

  const {data: hospitalsData, isLoading} = useSearchHospitals({
    district,
  });

  const hospitals = Array.isArray(hospitalsData?.data)
    ? hospitalsData.data
    : [];

  const handleNext = () => {
    if (selectedHospital) {
      storage.saveSelectedHospital(selectedHospital);
      navigation?.navigate('BookingDateTime', {
        selectedMember,
        selectedCaregiver,
        selectedService,
        selectedHospital,
        selectedArea,
        serviceType,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="Select Hospital" onBack={() => navigation?.goBack()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.searchSection}>
          <SearchableDropdown
            data={bangladeshDistricts}
            label="District"
            placeholder="Select district"
            value={district}
            onSelect={setDistrict}
            icon="location-outline"
            containerStyle={styles.dropdownContainer}
          />
          <SearchableDropdown
            data={bangladeshCities}
            label="City"
            placeholder="Select city"
            value={city}
            onSelect={setCity}
            icon="business-outline"
            containerStyle={styles.dropdownContainer}
          />
        </View>

        {isLoading ? (
          <HospitalSkeleton />
        ) : hospitals.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="medkit-outline" size={64} color="#E3E8F0" />
            <Text style={styles.emptyTitle}>No Hospitals Found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        ) : (
          <View style={styles.hospitalGrid}>
            {hospitals.map(hospital => {
              const isSelected = selectedHospital?.id === hospital.id;
              const locationLine = [hospital.thana, hospital.district]
                .filter(Boolean)
                .join(', ');

              return (
                <TouchableOpacity
                  key={hospital.id}
                  activeOpacity={0.85}
                  style={[
                    styles.hospitalCard,
                    isSelected && styles.selectedCard,
                  ]}
                  onPress={() => setSelectedHospital(hospital)}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                      <View style={styles.placeholderAvatar}>
                        <Icon name="medkit" size={24} color="#008178" />
                      </View>
                    </View>

                    <View style={styles.userInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.name} numberOfLines={1}>
                          {hospital.name}
                        </Text>
                        {hospital.is_verified || hospital.is_active ? (
                          <View style={styles.availableBadge}>
                            <Text style={styles.availableBadgeText}>
                              Verified
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.infoRow}>
                        <Icon name="star" size={14} color="#F59E0B" />
                        <Text style={styles.infoText}>
                          {hospital.rating ?? '—'}
                          {hospital.type ? ` · ${hospital.type}` : ''}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Icon name="location-outline" size={14} color="#303944" />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {locationLine || hospital.address || 'No location'}
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

                  {!!hospital.address && (
                    <Text style={styles.bioText} numberOfLines={2}>
                      {hospital.address}
                    </Text>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.priceBlock}>
                      {hospital.rating != null && hospital.rating !== '' ? (
                        <Text style={styles.price}>
                          {hospital.rating}
                          <Text style={styles.perHour}> rating</Text>
                        </Text>
                      ) : null}
                    </View>

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
            !selectedHospital && styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={!selectedHospital}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HospitalSelection;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  searchSection: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },

  dropdownContainer: {
    flex: 1,
  },

  emptyState: {
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

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  hospitalGrid: {
    flexDirection: 'column',
  },

  hospitalCard: {
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

  placeholderAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
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
