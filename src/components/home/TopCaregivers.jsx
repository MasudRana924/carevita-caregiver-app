import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const CAREGIVERS = [
  {
    id: 1,
    name: 'David Miller',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: '4.9',
    specialty: 'Elder Care Specialist',
    price: '৳800/hr',
  },
  {
    id: 2,
    name: 'Sarah Jenkins',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: '4.8',
    specialty: 'Home Assistant',
    price: '৳700/hr',
  },
  {
    id: 3,
    name: 'Karim Mia',
    image: 'https://randomuser.me/api/portraits/men/52.jpg',
    rating: '4.7',
    specialty: 'Child Care Expert',
    price: '৳650/hr',
  },
];

const TopCaregivers = ({navigation}) => {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top caregivers</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('AllCaregivers')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {CAREGIVERS.map(caregiver => (
          <TouchableOpacity
            activeOpacity={0.85}
            key={caregiver.id}
            style={styles.card}
            onPress={() =>
              navigation?.navigate('CaregiverDetails', {caregiver})
            }>
            <View style={styles.imageContainer}>
              <Image source={{uri: caregiver.image}} style={styles.image} />
              <View style={styles.ratingBadge}>
                <Icon name="star" size={11} color="#F59E0B" />
                <Text style={styles.ratingText}>{caregiver.rating}</Text>
              </View>
            </View>

            <Text style={styles.name} numberOfLines={1}>
              {caregiver.name}
            </Text>
            <Text style={styles.specialty} numberOfLines={1}>
              {caregiver.specialty}
            </Text>

            <View style={styles.bottom}>
              <Text style={styles.price}>{caregiver.price}</Text>
              <View style={styles.profileBtn}>
                <Text style={styles.profileBtnText}>View</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default TopCaregivers;

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

  scroll: {
    paddingRight: 4,
  },

  card: {
    width: 168,
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    paddingBottom: 14,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F6F6F6',
  },

  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#E3E8F0',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  ratingBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#172333',
    marginLeft: 3,
  },

  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111820',
    marginTop: 10,
    paddingHorizontal: 12,
  },

  specialty: {
    fontSize: 12,
    color: '#8190A7',
    marginTop: 3,
    paddingHorizontal: 12,
  },

  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    marginTop: 12,
  },

  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#008178',
  },

  profileBtn: {
    backgroundColor: '#E6F4F3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  profileBtnText: {
    color: '#008178',
    fontSize: 12,
    fontWeight: '700',
  },
});
