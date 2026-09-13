import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const SERVICES = [
  {
    id: 'caregiver',
    title: 'Caregiver',
    icon: 'people-outline',
  },
  {
    id: 'nurse',
    title: 'Nurse',
    icon: 'medkit-outline',
  },
  {
    id: 'autistic',
    title: 'Autistic care',
    icon: 'happy-outline',
  },
  {
    id: 'physio',
    title: 'Physio',
    icon: 'fitness-outline',
  },
];

const QuickServices = ({navigation}) => {
  const handlePress = service => {
    navigation?.navigate('SelectFamilyMember', {
      serviceType: service.id,
    });
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick services</Text>
      </View>

      <View style={styles.grid}>
        {SERVICES.map(service => (
          <TouchableOpacity
            activeOpacity={0.75}
            key={service.id}
            style={styles.item}
            onPress={() => handlePress(service)}>
            <View style={styles.iconCircle}>
              <Icon name={service.icon} size={22} color="#008178" />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {service.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default QuickServices;

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: 26,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#111820',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  item: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 14,
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 11,
    color: '#303944',
    marginTop: 7,
    textAlign: 'center',
    fontWeight: '500',
  },
});
