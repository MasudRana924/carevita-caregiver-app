import React, {createContext, useContext, useEffect, useState, useRef} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {io} from 'socket.io-client';
import {getApiHost} from '../api/endpoints';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({children}) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token || !mounted) {
          return;
        }

        const host = getApiHost();
        const newSocket = io(host, {
          auth: {token},
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          if (mounted) {
            setIsConnected(true);
            console.log('Socket connected');
          }
        });

        newSocket.on('disconnect', () => {
          if (mounted) {
            setIsConnected(false);
            console.log('Socket disconnected');
          }
        });

        newSocket.on('connect_error', error => {
          console.error('Socket connection error:', error);
        });

        newSocket.on('message:new', message => {
          console.log('New message received:', message);
        });

        newSocket.on('conversation:messages_read', data => {
          console.log('Conversation marked as read:', data);
        });

        setSocket(newSocket);
      } catch (error) {
        console.error('Error setting up socket:', error);
      }
    };

    connectSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const joinConversation = conversationId => {
    if (socket && isConnected) {
      socket.emit('conversation:join', {conversation_id: conversationId}, response => {
        if (response?.ok) {
          console.log('Joined conversation room:', conversationId);
        }
      });
    }
  };

  const sendMessage = (conversationId, message, messageType = 'text') => {
    return new Promise((resolve, reject) => {
      if (socket && isConnected) {
        socket.emit(
          'message:send',
          {conversation_id: conversationId, message, message_type: messageType},
          response => {
            if (response?.ok) {
              resolve(response.data);
            } else {
              reject(new Error('Failed to send message'));
            }
          },
        );
      } else {
        reject(new Error('Socket not connected'));
      }
    });
  };

  const markMessagesAsRead = conversationId => {
    return new Promise((resolve, reject) => {
      if (socket && isConnected) {
        socket.emit('message:mark_read', {conversation_id: conversationId}, response => {
          if (response?.ok) {
            resolve();
          } else {
            reject(new Error('Failed to mark messages as read'));
          }
        });
      } else {
        reject(new Error('Socket not connected'));
      }
    });
  };

  const onNewMessage = callback => {
    if (socket) {
      socket.on('message:new', callback);
    }
  };

  const onMessagesRead = callback => {
    if (socket) {
      socket.on('conversation:messages_read', callback);
    }
  };

  const offNewMessage = callback => {
    if (socket) {
      socket.off('message:new', callback);
    }
  };

  const offMessagesRead = callback => {
    if (socket) {
      socket.off('conversation:messages_read', callback);
    }
  };

  const value = {
    socket,
    isConnected,
    joinConversation,
    sendMessage,
    markMessagesAsRead,
    onNewMessage,
    onMessagesRead,
    offNewMessage,
    offMessagesRead,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export default SocketContext;
