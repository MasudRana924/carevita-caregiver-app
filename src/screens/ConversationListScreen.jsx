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
import {useConversations, useConversationUnreadCount} from '../api/queries';
import {useMarkMessagesAsRead} from '../api/mutations';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import {unwrapList} from '../api/envelope';

const ConversationListScreen = ({navigation}) => {
  const {data: conversationsData, isLoading, refetch} = useConversations({
    page: 1,
    limit: 20,
  });
  const unreadQuery = useConversationUnreadCount();
  const markAsRead = useMarkMessagesAsRead();
  const conversations = unwrapList(conversationsData);
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

  const handleConversationPress = async conversation => {
    try {
      if (conversation.id) {
        await markAsRead.mutateAsync(conversation.id);
        refetch();
        unreadQuery.refetch();
      }
      navigation.navigate('ConversationDetail', {
        conversationId: conversation.id,
        subject: conversation.subject,
      });
    } catch (error) {
      console.error('Error handling conversation press:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={markAsRead.isPending} overlay />
      <Header
        title="Messages"
        showBack={false}
        leftIcon="chatbubbles-outline"
        rightComponent={
          unread > 0 ? (
            <TouchableOpacity
              onPress={async () => {
                try {
                  for (const conversation of conversations) {
                    if (conversation.id) {
                      await markAsRead.mutateAsync(conversation.id);
                    }
                  }
                  refetch();
                  unreadQuery.refetch();
                } catch (error) {
                  console.error('Failed to mark all as read:', error);
                }
              }}>
              <Text style={styles.markAll} numberOfLines={1}>
                Read all
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="chatbubbles-outline" size={32} color="#008178" />
            </View>
            <Text style={styles.emptyTitle}>No conversations</Text>
            <Text style={styles.emptyText}>
              Start a conversation with support or admin
            </Text>
          </View>
        ) : (
          conversations.map(conversation => {
            const isUnread = !conversation.is_read || conversation.unread_count > 0;
            return (
              <TouchableOpacity
                key={conversation.id}
                style={[styles.card, isUnread && styles.cardUnread]}
                onPress={() => handleConversationPress(conversation)}>
                <View style={styles.iconWrap}>
                  <Icon name="person-outline" size={20} color="#008178" />
                </View>

                <View style={styles.content}>
                  <View style={styles.topRow}>
                    <Text
                      style={[styles.subject, isUnread && styles.subjectUnread]}
                      numberOfLines={1}>
                      {conversation.subject || 'Support'}
                    </Text>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>
                  <Text
                    style={[styles.message, isUnread && styles.messageUnread]}
                    numberOfLines={2}>
                    {conversation.last_message || 'No messages yet'}
                  </Text>
                  <Text style={styles.time}>
                    {formatTime(conversation.updated_at || conversation.created_at)}
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

export default ConversationListScreen;

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
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 14,
    color: '#8190A7',
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
    alignItems: 'center',
    marginBottom: 4,
  },
  subject: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: '#303944',
    fontWeight: '500',
  },
  subjectUnread: {
    color: '#111820',
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#303944',
    fontWeight: '400',
  },
  messageUnread: {
    color: '#111820',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#008178',
    marginLeft: 8,
  },
  time: {
    marginTop: 6,
    fontSize: 12,
    color: '#8190A7',
  },
  markAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0B8A80',
    flexShrink: 0,
  },
});
