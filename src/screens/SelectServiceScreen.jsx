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
import Header from '../components/common/Header';
import {CARE_SERVICES} from '../data/careServices';
import {storage} from '../utils/storage';

const SelectServiceScreen = ({navigation, route}) => {
  const {selectedMember, serviceType} = route.params || {};
  const preselected =
    CARE_SERVICES.find(s => s.id === serviceType || s.category === serviceType) ||
    null;
  const [selectedService, setSelectedService] = useState(preselected);

  const handleNext = async () => {
    if (!selectedService) {
      return;
    }
    await storage.saveSelectedService(selectedService);
    navigation?.navigate('AreaSelect', {
      selectedMember,
      selectedService,
      serviceType: selectedService.category || selectedService.id,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="Select a care service" onBack={() => navigation?.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Choose the type of care your family member needs. Prices shown are
          starting rates.
        </Text>

        {CARE_SERVICES.map(service => {
          const selected = selectedService?.id === service.id;
          return (
            <TouchableOpacity
              key={service.id}
              activeOpacity={0.85}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => setSelectedService(service)}>
              <View style={styles.cardTop}>
                <View style={styles.titleRow}>
                  <View style={styles.iconWrap}>
                    <Icon name={service.icon} size={20} color="#008178" />
                  </View>
                  <Text style={styles.title} numberOfLines={1}>
                    {service.title}
                  </Text>
                </View>
                {!!service.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{service.badge}</Text>
                  </View>
                )}
                {selected && !service.badge && (
                  <Icon name="checkmark-circle" size={22} color="#008178" />
                )}
              </View>

              <Text style={styles.description} numberOfLines={3}>
                {service.description}
              </Text>
              <Text style={styles.price}>{service.priceLabel}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.nextButton, !selectedService && styles.disabledButton]}
          onPress={handleNext}
          disabled={!selectedService}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SelectServiceScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#8190A7',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#F6F6F6',
  },
  cardSelected: {
    borderColor: '#008178',
    backgroundColor: '#E6F4F3',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#008178',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111820',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: '#8190A7',
    marginBottom: 12,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111820',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#B5C0D0',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
