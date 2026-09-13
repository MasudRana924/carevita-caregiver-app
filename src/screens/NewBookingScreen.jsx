import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const services = [
  {
    id: 'hospital',
    title: 'Hospital Visit Assistance',
    description: 'Accompany patient to hospital, registration & billing',
    price: '৳800',
    icon: 'business',
  },
  {
    id: 'nursing',
    title: 'Home Nursing',
    description: 'Professional nurse visits at home',
    price: '৳1,500',
    icon: 'fitness',
  },
  {
    id: 'elderly',
    title: 'Elderly Companion',
    description: 'Daily companionship and personal assistance',
    price: '৳700',
    icon: 'heart-outline',
  },
];

const patients = [
  {
    id: 'abul',
    name: 'Abul Hossain',
    relation: 'Father',
    age: '72',
    image: 'https://randomuser.me/api/portraits/men/75.jpg',
  },
  {
    id: 'farida',
    name: 'Farida Begum',
    relation: 'Mother',
    age: '68',
    image: 'https://randomuser.me/api/portraits/women/65.jpg',
  },
];

const NewBookingScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [selectedService, setSelectedService] = useState('hospital');
  const [selectedPatient, setSelectedPatient] = useState('abul');

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
          <Icon name="arrow-back" size={25} color="#182331" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>New Booking</Text>
      </View>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* =================================================
            PROGRESS
        ================================================= */}

        <View style={styles.progressContainer}>
          {[0, 1, 2, 3, 4].map(index => (
            <View
              key={index}
              style={[styles.progressSegment, index === 0 && styles.progressSegmentActive]}
            />
          ))}
        </View>

        <Text style={styles.stepText}>Step 1 of 5 — Service & Patient</Text>

        {/* =================================================
            SELECT SERVICE
        ================================================= */}

        <Text style={styles.sectionTitle}>Select Service</Text>

        <View style={styles.servicesContainer}>
          {services.map(service => {
            const selected = selectedService === service.id;

            return (
              <TouchableOpacity
                key={service.id}
                activeOpacity={0.85}
                onPress={() => setSelectedService(service.id)}
                style={[styles.serviceCard, selected && styles.serviceCardSelected]}>
                {/* Icon */}

                <View style={[styles.serviceIcon, selected && styles.serviceIconSelected]}>
                  <Icon
                    name={service.icon}
                    size={25}
                    color={selected ? '#FFFFFF' : '#7D8BA5'}
                  />
                </View>

                {/* Information */}

                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>

                  <Text style={styles.serviceDescription}>{service.description}</Text>

                  <Text style={styles.servicePrice}>From {service.price}</Text>
                </View>

                {/* Selected */}

                {selected && (
                  <View style={styles.selectedIcon}>
                    <Icon
                      name="checkmark-circle-outline"
                      size={22}
                      color="#1473DC"
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* =================================================
            SELECT PATIENT
        ================================================= */}

        <Text style={[styles.sectionTitle, styles.patientTitle]}>Select Patient</Text>

        <View style={styles.patientContainer}>
          {patients.map(patient => {
            const selected = selectedPatient === patient.id;

            return (
              <TouchableOpacity
                key={patient.id}
                activeOpacity={0.85}
                onPress={() => setSelectedPatient(patient.id)}
                style={[styles.patientCard, selected && styles.patientCardSelected]}>
                {/* Avatar */}

                <View style={styles.patientAvatar}>
                  <Text style={styles.avatarEmoji}>{patient.id === 'abul' ? '👴' : '👵'}</Text>
                </View>

                {/* Info */}

                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.name}</Text>

                  <Text style={styles.patientDetails}>
                    {patient.relation} · {patient.age} yrs
                  </Text>
                </View>

                {/* Selected */}

                {selected && (
                  <Icon
                    name="checkmark-circle-outline"
                    size={22}
                    color="#1473DC"
                  />
                )}
              </TouchableOpacity>
            );
          })}

          {/* Add family member */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.addPatientButton}
            onPress={() => navigation?.navigate('AddFamilyMember')}>
            <View style={styles.addIcon}>
              <Icon name="add" size={25} color="#7D8BA5" />
            </View>

            <Text style={styles.addPatientText}>Add another family member</Text>
          </TouchableOpacity>
        </View>

        {/* Space for fixed button */}
        <View style={[styles.bottomSpacing, {height: 80 + insets.bottom}]} />
      </ScrollView>

      {/* =====================================================
          FIXED CONTINUE BUTTON
      ===================================================== */}

      <View style={[styles.bottomBar, {bottom: insets.bottom}]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.continueButton}
          onPress={() => {
            navigation?.navigate('BookingStep2', {
              service: selectedService,
              patient: selectedPatient,
            });
          }}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default NewBookingScreen;

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
    height: 61,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 19,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E9EEF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  headerTitle: {
   fontSize: 15,
    fontWeight: 'bold',
    color: '#11182e',
    flex: 1,
    textAlign: 'center',
  },

  // =======================================================
  // SCROLL
  // =======================================================

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 20,
  },

  // =======================================================
  // PROGRESS
  // =======================================================

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  progressSegment: {
    height: 6,
    borderRadius: 4,
    backgroundColor: '#E7EBF2',
    flex: 1,
    marginRight: 5,
  },

  progressSegmentActive: {
    backgroundColor: '#008178',
  },

  stepText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7D8BA5',
    marginTop: 5,
  },

  // =======================================================
  // SECTION TITLE
  // =======================================================

  sectionTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    color: '#182331',
    marginTop: 17,
    marginBottom: 13,
  },

  // =======================================================
  // SERVICES
  // =======================================================

  servicesContainer: {
    width: '100%',
  },

  serviceCard: {
    width: '100%',
    minHeight: 93,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE5EE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 9,
  },

  serviceCardSelected: {
    backgroundColor: '#E8F2FE',
    borderColor: '#1473DC',
    borderWidth: 1.5,
  },

  serviceIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#E9EEF5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  serviceIconSelected: {
    backgroundColor: '#008178',
  },

  serviceInfo: {
    flex: 1,
    marginLeft: 13,
    paddingRight: 18,
  },

  serviceTitle: {
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '700',
    color: '#182331',
  },

  serviceDescription: {
    fontSize: 13.5,
    lineHeight: 19,
    color: '#7D8BA5',
    marginTop: 1,
  },

  servicePrice: {
    fontSize: 13,
    lineHeight: 18,
    color: '#1473DC',
    fontWeight: '700',
    marginTop: 1,
  },

  selectedIcon: {
    position: 'absolute',
    right: 13,
    top: 16,
  },

  // =======================================================
  // PATIENT
  // =======================================================

  patientTitle: {
    marginTop: 18,
    marginBottom: 13,
  },

  patientContainer: {
    width: '100%',
  },

  patientCard: {
    width: '100%',
    height: 72,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE5EE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 9,
  },

  patientCardSelected: {
    backgroundColor: '#E8F2FE',
    borderColor: '#1473DC',
    borderWidth: 1.5,
  },

  patientAvatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#DCE1E7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarEmoji: {
    fontSize: 27,
  },

  patientInfo: {
    flex: 1,
    marginLeft: 13,
  },

  patientName: {
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '700',
    color: '#182331',
  },

  patientDetails: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7D8BA5',
    marginTop: 1,
  },

  // =======================================================
  // ADD PATIENT
  // =======================================================

  addPatientButton: {
    width: '100%',
    height: 72,
    borderRadius: 22,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DDE3EC',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  addIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#EAF0F8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addPatientText: {
    fontSize: 15,
    color: '#7D8BA5',
    marginLeft: 13,
  },

  // =======================================================
  // BOTTOM
  // =======================================================

  bottomSpacing: {
    height: 80,
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: '#FFF',
    paddingTop: 9,
  },

  continueButton: {
    width: '100%',
    height: 76,
    borderRadius: 17,
    backgroundColor: '#008178',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  continueText: {
    fontSize: 16,
    lineHeight: 21,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
});
