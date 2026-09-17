import React, {useEffect, useMemo, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import {useNotificationPreferences} from '../api/queries';
import {useUpdateNotificationPreferences} from '../api/mutations';
import {unwrapData} from '../api/envelope';

export const PUSH_TYPES = [
  {key: 'BOOKING_CREATED', label: 'New booking assigned'},
  {key: 'PAYMENT_RECEIVED', label: 'Payment received'},
  {key: 'SERVICE_START_REMINDER', label: 'Service start reminder'},
  {key: 'EARNING_SETTLED', label: 'Earning settled'},
  {key: 'REVIEW_RECEIVED', label: 'New review'},
  {key: 'DISPUTE_UPDATED', label: 'Dispute updates'},
  {key: 'WITHDRAWAL_UPDATED', label: 'Withdrawal updates'},
];

const defaultPrefs = () =>
  PUSH_TYPES.reduce((acc, item) => {
    acc[item.key] = true;
    return acc;
  }, {});

const normalizePrefs = payload => {
  const data = unwrapData(payload);
  const source =
    data?.preferences && typeof data.preferences === 'object'
      ? data.preferences
      : data;
  return {...defaultPrefs(), ...(source || {})};
};

const NotificationPreferencesScreen = ({navigation}) => {
  const {data, isLoading} = useNotificationPreferences();
  const saveMutation = useUpdateNotificationPreferences();
  const [prefs, setPrefs] = useState(defaultPrefs());

  const remote = useMemo(() => normalizePrefs(data), [data]);

  useEffect(() => {
    setPrefs(remote);
  }, [remote]);

  const toggle = key => {
    setPrefs(prev => ({...prev, [key]: !prev[key]}));
  };

  const handleSave = async () => {
    try {
      const body = data?.data?.preferences ? {preferences: prefs} : prefs;
      await saveMutation.mutateAsync(body);
      Alert.alert('Saved', 'Notification preferences updated');
      navigation?.goBack();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to save preferences');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={saveMutation.isPending} />
      <Header title="Notifications" onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Mute push types you do not want. You can still open items from Inbox.
        </Text>
        {isLoading ? <Text style={styles.intro}>Loading...</Text> : null}
        {PUSH_TYPES.map(item => {
          const enabled = prefs[item.key] !== false;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.row}
              onPress={() => toggle(item.key)}
              activeOpacity={0.8}>
              <View style={styles.copy}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.sub}>{enabled ? 'On' : 'Muted'}</Text>
              </View>
              <View style={[styles.toggle, enabled && styles.toggleOn]}>
                <View style={[styles.knob, enabled && styles.knobOn]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save preferences</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default NotificationPreferencesScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'},
  content: {paddingHorizontal: 20, paddingBottom: 24},
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8190A7',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  copy: {flex: 1, paddingRight: 12},
  label: {fontSize: 15, fontWeight: '700', color: '#111820'},
  sub: {marginTop: 4, fontSize: 12, color: '#8190A7'},
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {backgroundColor: '#008178'},
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  knobOn: {alignSelf: 'flex-end'},
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  saveButton: {
    height: 52,
    backgroundColor: '#008178',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {fontSize: 16, fontWeight: '600', color: '#FFFFFF'},
});
