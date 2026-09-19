import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../context/AuthContext';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
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
              <Icon name="person" size={26} color="#5B8F86" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.greetingBlock}>
          <Text style={styles.goodMorning}>
            {greeting}, <Text style={styles.wave}>👋</Text>
          </Text>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>

        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.notificationButton}
        onPress={() => navigation?.navigate('Inbox')}>
        <Icon name="notifications-outline" size={22} color="#1B2430" />
        {unreadCount > 0 ? <View style={styles.badgeDot} /> : null}
      </TouchableOpacity>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  header: {
    minHeight: 72,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#D8EFE9',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D8EFE9',
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
    color: '#8A97A6',
    fontWeight: '500',
  },
  wave: {
    fontSize: 13,
  },
  userName: {
    fontSize: 22,
    lineHeight: 28,
    color: '#15202B',
    fontWeight: '800',
    marginTop: 1,
  },
  roleRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    color: '#8A97A6',
    fontWeight: '500',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E34242',
    right: 10,
    top: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
