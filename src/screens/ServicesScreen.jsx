import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const ServicesScreen = () => {
  const services = [
    {
      id: 1,
      name: 'Home Caregiver',
      desc: 'Daily care for elderly & patients',
      icon: 'heart-outline',
      color: '#008178',
    },
    {
      id: 2,
      name: 'Registered Nurse',
      desc: 'Professional nursing at home',
      icon: 'fitness-outline',
      color: '#16B890',
    },
    {
      id: 3,
      name: 'Hospital Attendant',
      desc: '24/7 hospital companionship',
      icon: 'business-outline',
      color: '#E67E22',
    },
    {
      id: 4,
      name: 'Physiotherapy',
      desc: 'Recovery & rehabilitation at home',
      icon: 'pulse',
      color: '#9B59B6',
    },
    {
      id: 5,
      name: 'Baby Care',
      desc: 'Newborn & infant care support',
      icon: 'happy-outline',
      color: '#E74C3C',
    },
    {
      id: 6,
      name: 'Medical Equipment',
      desc: 'Rent medical devices & supplies',
      icon: 'medkit',
      color: '#3498DB',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        <Text style={styles.subtitle}>
          Choose from our professional care services
        </Text>

        {services.map(service => (
          <TouchableOpacity
            key={service.id}
            activeOpacity={0.8}
            style={styles.serviceCard}>
            <View style={[styles.iconBg, {backgroundColor: service.color + '15'}]}>
              <Icon
                name={service.icon}
                size={28}
                color={service.color}
              />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDesc}>{service.desc}</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#008178" />
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
};

export default ServicesScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 6,
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#182331',
    letterSpacing: -0.4,
  },

  scrollContent: {
    paddingBottom: 85,
    paddingHorizontal: 24,
  },

  subtitle: {
    fontSize: 12,
    color: '#7D8BA5',
    marginTop: 4,
    marginBottom: 22,
  },

  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EDF1F7',
  },

  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  serviceInfo: {
    flex: 1,
    marginLeft: 16,
  },

  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#182331',
  },

  serviceDesc: {
    fontSize: 13.5,
    color: '#7D8BA5',
    marginTop: 3,
  },
});
