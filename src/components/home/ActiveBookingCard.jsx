import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const ActiveBookingCard = ({navigation}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconTile}>
          <Icon name="medkit-outline" size={20} color="#008178" />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            Hospital Assistance
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>On the way</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Icon name="person-outline" size={15} color="#303944" />
        <Text style={styles.infoText} numberOfLines={1}>
          Rahim Ahmed
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Icon name="location-outline" size={15} color="#303944" />
        <Text style={styles.infoText} numberOfLines={1}>
          Square Hospital
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.trackBtn}
        onPress={() => navigation?.navigate('Bookings')}>
        <Text style={styles.trackBtnText}>Track live</Text>
        <Icon name="chevron-forward" size={16} color="#008178" />
      </TouchableOpacity>
    </View>
  );
};

export default ActiveBookingCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#008178',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#13C875',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#008178',
  },


  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },

  infoText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 12,
    color: '#fff',
  },

  trackBtn: {
    marginTop: 8,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E6F4F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  trackBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008178',
  },
});
