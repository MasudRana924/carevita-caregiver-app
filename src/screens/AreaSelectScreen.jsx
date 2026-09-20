import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../components/common/Header';
import SearchableDropdown from '../components/common/SearchableDropdown';
import AppInput from '../components/common/AppInput';
import AppButton, {AppButtonBar} from '../components/common/AppButton';
import {bangladeshDistricts} from '../data/bangladeshLocations';
import {getThanasByDistrict} from '../data/bangladeshThanas';
import {storage} from '../utils/storage';
import {showError} from '../context/ErrorModalContext';

const AreaSelectScreen = ({navigation, route}) => {
  const {
    selectedMember,
    selectedService,
    serviceType = 'caregiver',
  } = route.params || {};
  const [district, setDistrict] = useState('');
  const [thana, setThana] = useState('');
  const [fullAddress, setFullAddress] = useState('');

  const thanaOptions = useMemo(() => getThanasByDistrict(district), [district]);

  const handleDistrictSelect = value => {
    setDistrict(value);
    setThana('');
  };

  const canContinue =
    !!district && !!thana && !!fullAddress.trim();

  const handleNext = async () => {
    if (!district || !thana) {
      showError('Please select both district and thana', 'Select area');
      return;
    }
    if (!fullAddress.trim()) {
      showError('Please enter your full address', 'Full address');
      return;
    }

    const selectedArea = {
      district,
      thana,
      fullAddress: fullAddress.trim(),
    };
    await storage.saveSelectedArea(selectedArea);

    navigation?.navigate('SelectCaregiver', {
      selectedMember,
      selectedService,
      selectedArea,
      district,
      thana,
      serviceType,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="Select location" onBack={() => navigation?.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Icon name="map-outline" size={22} color="#008178" />
              </View>
              <Text style={styles.heroTitle}>Where do you need care?</Text>
            </View>
            <Text style={styles.heroText}>
              Select district, thana and enter your full address
            </Text>
          </View>

          <SearchableDropdown
            data={bangladeshDistricts}
            label="District"
            placeholder="Select district"
            value={district}
            onSelect={handleDistrictSelect}
            icon="business-outline"
          />

          <SearchableDropdown
            data={thanaOptions}
            label="Thana"
            placeholder={district ? 'Select thana' : 'Select district first'}
            value={thana}
            onSelect={setThana}
            icon="location-outline"
          />

          <AppInput
            label="Full address"
            icon="home-outline"
            value={fullAddress}
            onChangeText={setFullAddress}
            placeholder="House, road, block, landmark..."
            multiline
          />
        </ScrollView>

        <AppButtonBar>
          <AppButton
            title="Next"
            onPress={handleNext}
            disabled={!canContinue}
            style={styles.flexBtn}
          />
        </AppButtonBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AreaSelectScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  hero: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111820',
  },
  heroText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8190A7',
  },
  flexBtn: {flex: 1},
});
