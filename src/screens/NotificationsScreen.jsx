import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const NotificationsScreen = () => {
  const notifications = [
    {
      id: 1,
      title: 'Booking Confirmed',
      message: 'Your booking with Rahim Ahmed has been confirmed for tomorrow at 10:00 AM',
      time: '2 hours ago',
      type: 'success',
      icon: 'checkmark-circle',
    },
    {
      id: 2,
      title: 'Payment Successful',
      message: 'Payment of ৳800 for hospital visit has been processed successfully',
      time: '5 hours ago',
      type: 'success',
      icon: 'card-outline',
    },
    {
      id: 3,
      title: 'New Caregiver Available',
      message: 'Fatema Khanam is now available in your area. Check her profile!',
      time: '1 day ago',
      type: 'info',
      icon: 'person-add-outline',
    },
    {
      id: 4,
      title: 'Booking Reminder',
      message: 'Don\'t forget your upcoming appointment with Karim Mia on Friday',
      time: '2 days ago',
      type: 'warning',
      icon: 'notifications',
    },
    {
      id: 5,
      title: 'Profile Updated',
      message: 'Your profile information has been successfully updated',
      time: '3 days ago',
      type: 'info',
      icon: 'person-outline',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.markAllRead}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {notifications.map(notification => (
          <TouchableOpacity
            key={notification.id}
            activeOpacity={0.8}
            style={styles.notificationCard}>
            <View
              style={[
                styles.iconContainer,
                notification.type === 'success' && styles.iconSuccess,
                notification.type === 'warning' && styles.iconWarning,
                notification.type === 'info' && styles.iconInfo,
              ]}>
              <Icon
                name={notification.icon}
                size={22}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>

            <View style={[styles.unreadDot, notification.id <= 2 && styles.unreadDotVisible]} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
  },

  headerTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: '#182331',
    letterSpacing: -0.4,
  },

  markAllRead: {
    fontSize: 14,
    color: '#008178',
    fontWeight: '600',
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 85,
  },

  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF1F7',
    alignItems: 'flex-start',
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E0E5ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  iconSuccess: {
    backgroundColor: '#12B88A',
  },

  iconWarning: {
    backgroundColor: '#F6A900',
  },

  iconInfo: {
    backgroundColor: '#008178',
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#182331',
    marginBottom: 4,
  },

  notificationMessage: {
    fontSize: 13,
    color: '#7D8BA5',
    lineHeight: 19,
    marginBottom: 6,
  },

  notificationTime: {
    fontSize: 11,
    color: '#A8B3C4',
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
    marginLeft: 8,
    marginTop: 4,
  },

  unreadDotVisible: {
    backgroundColor: '#008178',
  },
});
