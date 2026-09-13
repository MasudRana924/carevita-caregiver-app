import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const NURSES = [
  {
    id: 1,
    name: 'Nurse Elena',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    rating: '5.0',
    reviews: 120,
    specialty: 'General Nursing',
    experience: '8 Yrs Exp',
    status: 'Available',
  },
  {
    id: 2,
    name: 'Nurse Marcus',
    image: 'https://randomuser.me/api/portraits/men/55.jpg',
    rating: '4.9',
    reviews: 85,
    specialty: 'ICU Specialist',
    experience: '5 Yrs Exp',
    status: 'Available',
  },
  {
    id: 3,
    name: 'Nurse Fatima',
    image: 'https://randomuser.me/api/portraits/women/42.jpg',
    rating: '4.8',
    reviews: 64,
    specialty: 'Pediatric Care',
    experience: '6 Yrs Exp',
    status: 'Available',
  },
];

const AvailableNurses = ({navigation}) => {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available nurses</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('SelectNurse')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {NURSES.map(nurse => (
          <TouchableOpacity
            activeOpacity={0.85}
            key={nurse.id}
            style={styles.card}
            onPress={() => navigation?.navigate('SelectNurse')}>
            <View style={styles.cardHeader}>
              <Image source={{uri: nurse.image}} style={styles.avatar} />

              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {nurse.name}
                  </Text>
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableBadgeText}>{nurse.status}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="star" size={14} color="#F59E0B" />
                  <Text style={styles.infoText}>
                    {nurse.rating} ({nurse.reviews}) · {nurse.experience}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="medkit-outline" size={14} color="#303944" />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {nurse.specialty}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default AvailableNurses;

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#111820',
  },

  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#008178',
  },

  list: {
    gap: 12,
  },

  card: {
    width: '100%',
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F6F6F6',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E3E8F0',
    marginRight: 13,
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },

  name: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#111820',
    marginRight: 8,
  },

  availableBadge: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: '#E6F4F3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  availableBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    color: '#008178',
    fontWeight: '600',
  },

  infoRow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },

  infoText: {
    marginLeft: 5,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400',
    color: '#303944',
  },
});
