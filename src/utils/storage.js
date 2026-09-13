import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SELECTED_FAMILY_MEMBER: 'selected_family_member',
  SELECTED_CAREGIVER: 'selected_caregiver',
  SELECTED_HOSPITAL: 'selected_hospital',
  SELECTED_AREA: 'selected_area',
  SELECTED_SERVICE: 'selected_service',
  AUTH_TOKEN: 'userToken',
};

export const storage = {
  // Family Member
  saveSelectedFamilyMember: async (member) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_FAMILY_MEMBER, JSON.stringify(member));
    } catch (error) {
      console.error('Error saving family member:', error);
    }
  },

  getSelectedFamilyMember: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_FAMILY_MEMBER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting family member:', error);
      return null;
    }
  },

  clearSelectedFamilyMember: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_FAMILY_MEMBER);
    } catch (error) {
      console.error('Error clearing family member:', error);
    }
  },

  // Caregiver
  saveSelectedCaregiver: async (caregiver) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CAREGIVER, JSON.stringify(caregiver));
    } catch (error) {
      console.error('Error saving caregiver:', error);
    }
  },

  getSelectedCaregiver: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_CAREGIVER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting caregiver:', error);
      return null;
    }
  },

  clearSelectedCaregiver: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_CAREGIVER);
    } catch (error) {
      console.error('Error clearing caregiver:', error);
    }
  },

  // Area (district + thana)
  saveSelectedArea: async area => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SELECTED_AREA,
        JSON.stringify(area),
      );
    } catch (error) {
      console.error('Error saving area:', error);
    }
  },

  getSelectedArea: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_AREA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting area:', error);
      return null;
    }
  },

  clearSelectedArea: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_AREA);
    } catch (error) {
      console.error('Error clearing area:', error);
    }
  },

  // Service
  saveSelectedService: async service => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SELECTED_SERVICE,
        JSON.stringify(service),
      );
    } catch (error) {
      console.error('Error saving service:', error);
    }
  },

  getSelectedService: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_SERVICE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting service:', error);
      return null;
    }
  },

  clearSelectedService: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_SERVICE);
    } catch (error) {
      console.error('Error clearing service:', error);
    }
  },

  // Hospital
  saveSelectedHospital: async (hospital) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_HOSPITAL, JSON.stringify(hospital));
    } catch (error) {
      console.error('Error saving hospital:', error);
    }
  },

  getSelectedHospital: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_HOSPITAL);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting hospital:', error);
      return null;
    }
  },

  clearSelectedHospital: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_HOSPITAL);
    } catch (error) {
      console.error('Error clearing hospital:', error);
    }
  },

  // Auth Token
  saveAuthToken: async (token) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  },

  getAuthToken: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  clearAuthToken: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  },

  // Clear all booking related data
  clearBookingData: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_FAMILY_MEMBER),
        AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_CAREGIVER),
        AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_HOSPITAL),
        AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_AREA),
        AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_SERVICE),
      ]);
    } catch (error) {
      console.error('Error clearing booking data:', error);
    }
  },
};

export default storage;
