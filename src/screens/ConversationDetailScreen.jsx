import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useMessages, useConversation} from '../api/queries';
import {useSendMessage, useMarkMessagesAsRead} from '../api/mutations';
import {useSocket} from '../context/SocketContext';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import {unwrapList} from '../api/envelope';

const ConversationDetailScreen = ({route, navigation}) => {
  const {conversationId, subject} = route.params || {};
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const scrollViewRef = useRef(null);
  const {socket, isConnected, joinConversation, sendMessage: socketSendMessage, onNewMessage, offNewMessage} = useSocket();
  
  const {data: messagesData, isLoading, refetch} = useMessages(conversationId, {
    page: 1,
    limit: 50,
  });
  const {data: conversationData} = useConversation(conversationId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();

  useEffect(() => {
    if (conversationId && isConnected) {
      joinConversation(conversationId);
    }
  }, [conversationId, isConnected, joinConversation]);

  useEffect(() => {
    const loadedMessages = unwrapList(messagesData) || [];
    setMessages(loadedMessages);
  }, [messagesData]);

  useEffect(() => {
    const handleNewMessage = newMessage => {
      if (newMessage.conversation_id === conversationId) {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      }
    };

    onNewMessage(handleNewMessage);

    return () => {
      offNewMessage(handleNewMessage);
    };
  }, [conversationId, onNewMessage, offNewMessage]);

  useEffect(() => {
    const markAsReadAsync = async () => {
      if (conversationId) {
        try {
          await markAsRead.mutateAsync(conversationId);
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      }
    };

    markAsReadAsync();
  }, [conversationId, markAsRead]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({animated: true});
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!messageText.trim() || !conversationId) {
      return;
    }

    const textToSend = messageText.trim();
    setMessageText('');

    try {
      if (isConnected && socket) {
        await socketSendMessage(conversationId, textToSend, 'text');
      } else {
        await sendMessage.mutateAsync({
          conversation_id: conversationId,
          message: textToSend,
          message_type: 'text',
        });
      }
      refetch();
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageText(textToSend);
    }
  };

  const formatTime = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isOwnMessage = message => {
    return message.sender_type === 'CAREGIVER' || message.is_sender;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Loader visible={sendMessage.isPending} overlay />
      <Header
        title={subject || 'Conversation'}
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="chatbubbles-outline" size={48} color="#8190A7" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Start the conversation by sending a message
              </Text>
            </View>
          ) : (
            messages.map((message, index) => {
              const own = isOwnMessage(message);
              return (
                <View
                  key={message.id || index}
                  style={[
                    styles.messageRow,
                    own ? styles.messageRowOwn : styles.messageRowOther,
                  ]}>
                  <View
                    style={[
                      styles.messageBubble,
                      own ? styles.bubbleOwn : styles.bubbleOther,
                    ]}>
                    <Text
                      style={[
                        styles.messageText,
                        own ? styles.textOwn : styles.textOther,
                      ]}>
                      {message.message}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        own ? styles.timeOwn : styles.timeOther,
                      ]}>
                      {formatTime(message.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#8190A7"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                messageText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
              ]}
              onPress={handleSend}
              disabled={!messageText.trim() || sendMessage.isPending}>
              <Icon
                name="send"
                size={20}
                color={messageText.trim() ? '#FFFFFF' : '#8190A7'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ConversationDetailScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#8190A7',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#111820',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#8190A7',
    textAlign: 'center',
  },
  messageRow: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  messageRowOwn: {
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
    marginRight: 'auto',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 60,
  },
  bubbleOwn: {
    backgroundColor: '#0B8A80',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  textOwn: {
    color: '#FFFFFF',
  },
  textOther: {
    color: '#111820',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeOther: {
    color: '#8190A7',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EEF2',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F6F6F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111820',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#0B8A80',
  },
  sendButtonInactive: {
    backgroundColor: '#E8EEF2',
  },
});
