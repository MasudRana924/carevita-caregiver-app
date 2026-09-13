import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const BookingButtons = ({navigation}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.button}
        onPress={() =>
          navigation?.navigate('SelectFamilyMember', {serviceType: 'caregiver'})
        }>
        <View style={styles.iconWrap}>
          <Icon name="person-add" size={18} color="#008178" />
        </View>
        <Text style={styles.buttonText} numberOfLines={1}>
          Book Caregiver
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.button}
        onPress={() => navigation?.navigate('SelectNurse')}>
        <View style={styles.iconWrap}>
          <Icon name="medical" size={18} color="#008178" />
        </View>
        <Text style={styles.buttonText} numberOfLines={1}>
          Book Nurse
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default BookingButtons;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },

  button: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },

  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  buttonText: {
    flexShrink: 1,
    color: '#111820',
    fontSize: 13,
    fontWeight: '600',
  },
});
