import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNotifications, useInboxUnreadCount} from '../api/queries';
import {useMarkAllInboxRead} from '../api/mutations';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import NotificationSkeleton from '../components/home/NotificationSkeleton';
import {apiRequest} from '../services/api';
import {unwrapList} from '../api/envelope';
import {
  parseNotificationData,
  handleNotificationClick,
  resolveInboxBookingId,
} from '../utils/notificationHandler';

const InboxScreen = ({navigation}) => {
  const {data: notificationsData, isLoading, refetch} = useNotifications({
    page: 1,
    limit: 20,
  });
  const unreadQuery = useInboxUnreadCount();
  const markAll = useMarkAllInboxRead();
  const notifications = unwrapList(notificationsData);
  const unread = unreadQuery.data?.unread ?? unreadQuery.data?.data?.unread ?? 0;

  const formatTime = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
  };

  const getNotificationIcon = type => {
    switch (String(type || '').toUpperCase()) {
      case 'BOOKING':
      case 'BOOKING_CREATED':
      case 'BOOKING_ACCEPTED':
      case 'BOOKING_REJECTED':
      case 'BOOKING_CANCELLED':
        return 'calendar-outline';
      case 'PAYMENT':
      case 'PAYMENT_RECEIVED':
        return 'card-outline';
      case 'SERVICE_START_REMINDER':
        return 'alarm-outline';
      case 'REVIEW_RECEIVED':
        return 'star-outline';
      case 'EARNING_SETTLED':
      case 'WITHDRAWAL_UPDATED':
        return 'wallet-outline';
      case 'DISPUTE_UPDATED':
        return 'alert-circle-outline';
      case 'CAREGIVER':
        return 'person-outline';
      default:
        return 'notifications-outline';
    }
  };

  const handleNotificationPress = async notification => {
    try {
      if (notification.id) {
        await apiRequest(`/inbox/${notification.id}/read`, 'PUT');
        refetch();
        unreadQuery.refetch();
      }

      let detail = notification;
      if (notification.id) {
        try {
          const detailResponse = await apiRequest(
            `/inbox/${notification.id}`,
            'GET',
          );
          if (detailResponse?.data) {
            detail = detailResponse.data;
          }
        } catch (error) {
          console.log('Inbox detail fetch failed, using list item');
        }
      }

      const nested = parseNotificationData(detail.data);
      handleNotificationClick(
        {
          ...nested,
          type: nested.type || detail.type,
          action: nested.action,
          screen: nested.screen,
          booking_id: resolveInboxBookingId(detail) || nested.booking_id,
          inbox_id: detail.id || notification.id,
        },
        navigation,
      );
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={markAll.isPending} overlay />
      <Header
        title="Inbox"
        showBack={false}
        leftIcon="mail-outline"
        rightComponent={
          unread > 0 ? (
            <TouchableOpacity
              onPress={async () => {
                try {
                  await markAll.mutateAsync();
                  refetch();
                  unreadQuery.refetch();
                } catch (error) {
                  console.log('Mark all read failed');
                }
              }}>
              <Text style={styles.markAll}>Read all</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="notifications-outline" size={32} color="#008178" />
            </View>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              Booking requests, reminders, ratings, and payments will show up here
            </Text>
          </View>
        ) : (
          notifications.map(notification => {
            const nested = parseNotificationData(notification.data);
            const type = nested.type || notification.type;
            const isUnread = !notification.is_read;
            return (
              <TouchableOpacity
                key={notification.id}
                style={[styles.card, isUnread && styles.cardUnread]}
                onPress={() => handleNotificationPress(notification)}>
                <View style={styles.iconWrap}>
                  <Icon
                    name={getNotificationIcon(type)}
                    size={20}
                    color="#008178"
                  />
                </View>

                <View style={styles.content}>
                  <View style={styles.topRow}>
                    <Text
                      style={[styles.message, isUnread && styles.messageUnread]}
                      numberOfLines={3}>
                      {notification.body ||
                        notification.message ||
                        notification.title}
                    </Text>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.time}>
                    {formatTime(notification.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default InboxScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E6F4F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111820',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#8190A7',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardUnread: {
    backgroundColor: '#E6F4F3',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#303944',
    fontWeight: '400',
  },
  messageUnread: {
    color: '#111820',
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#008178',
    marginLeft: 8,
    marginTop: 6,
  },
  time: {
    marginTop: 8,
    fontSize: 12,
    color: '#8190A7',
  },
  markAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#008178',
  },
});
