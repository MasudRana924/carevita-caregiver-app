import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../context/AuthContext';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const HomeHeader = ({navigation, unreadCount = 0}) => {
  const {user} = useAuth();
  const greeting = getGreeting();
  const displayName =
    user?.name || user?.full_name || user?.first_name || 'there';
  const photo = user?.photo || user?.profile_photo || user?.avatar;

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.profileButton}
          onPress={() => navigation?.navigate('Profile')}>
          {photo ? (
            <Image source={{uri: photo}} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Icon name="person" size={22} color="#8190A7" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.greetingBlock}>
          <Text style={styles.goodMorning}>{greeting}</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.notificationButton}
        onPress={() => navigation?.navigate('Inbox')}>
        <Icon name="notifications-outline" size={20} color="#172333" />
        {unreadCount > 0 && <View style={styles.notificationDot} />}
      </TouchableOpacity>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E6F4F3',
    marginRight: 12,
  },

  profileImage: {
    width: '100%',
    height: '100%',
  },

  placeholderAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  greetingBlock: {
    flex: 1,
    justifyContent: 'center',
  },

  goodMorning: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8190A7',
    fontWeight: '500',
  },

  userName: {
    fontSize: 18,
    lineHeight: 24,
    color: '#111820',
    fontWeight: '700',
    marginTop: 1,
  },

  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E34242',
    borderWidth: 1.5,
    borderColor: '#F6F6F6',
    right: 10,
    top: 10,
  },
});
