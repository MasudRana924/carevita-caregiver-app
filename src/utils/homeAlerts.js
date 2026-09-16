import {DeviceEventEmitter} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const REVIEW_RECEIVED_EVENT = 'nirapod_review_received';
const REVIEW_STORAGE_KEY = 'pending_review_received';

export const setPendingReview = async payload => {
  try {
    await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.log('Failed to store review alert', error);
  }
  DeviceEventEmitter.emit(REVIEW_RECEIVED_EVENT, payload);
};

export const getPendingReview = async () => {
  try {
    const raw = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const clearPendingReview = async () => {
  try {
    await AsyncStorage.removeItem(REVIEW_STORAGE_KEY);
  } catch (error) {
    console.log('Failed to clear review alert', error);
  }
};
