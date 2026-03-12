import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socketService from '../socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [onlineFriends, setOnlineFriends] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());

  // Connect to socket when authenticated
  useEffect(() => {
    let mounted = true;

    const connectSocket = async () => {
      if (!token || !isAuthenticated || !user) return;

      try {
        await socketService.connect(token);
        
        if (mounted) {
          setIsConnected(socketService.isConnected());
          setSocketId(socketService.getSocketId());
          
          // Mark user as online
          socketService.goOnline();
        }
      } catch (error) {
        console.error('Failed to connect socket:', error);
        toast.error('Failed to connect to real-time server');
      }
    };

    connectSocket();

    return () => {
      mounted = false;
      if (isAuthenticated) {
        socketService.goOffline();
        socketService.disconnect();
      }
    };
  }, [token, isAuthenticated, user]);

  // Set up socket event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Listen for connection status changes
    const onConnect = () => {
      setIsConnected(true);
      setSocketId(socketService.getSocketId());
      socketService.goOnline();
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setSocketId(null);
    };

    socketService.on('connect', onConnect);
    socketService.on('disconnect', onDisconnect);

    // Listen for friend online/offline events
    socketService.onFriendOnline(({ userId }) => {
      setOnlineFriends(prev => new Set([...prev, userId]));
    });

    socketService.onFriendOffline(({ userId }) => {
      setOnlineFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Listen for typing events
    socketService.onUserTyping(({ userId, conversationId, isTyping }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const key = `${conversationId}-${userId}`;
        
        if (isTyping) {
          newMap.set(key, {
            userId,
            conversationId,
            timestamp: Date.now()
          });
        } else {
          newMap.delete(key);
        }
        
        return newMap;
      });
    });

    // Listen for friend requests
    socketService.onFriendRequest((data) => {
      toast.custom((t) => (
        <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-primary-500">
          <p className="font-medium">New Friend Request</p>
          <p className="text-sm text-gray-600">{data.name} wants to connect</p>
          <button
            onClick={() => window.location.href = '/friends'}
            className="mt-2 text-sm text-primary-600 font-medium"
          >
            View Request
          </button>
        </div>
      ), { duration: 5000 });
    });

    // Cleanup listeners
    return () => {
      socketService.off('connect');
      socketService.off('disconnect');
      socketService.off('friend:online');
      socketService.off('friend:offline');
      socketService.off(SOCKET_EVENTS.USER_TYPING);
      socketService.off('friendRequest');
    };
  }, [isConnected]);

  /**
   * Check if a user is online
   * @param {string} userId - User ID to check
   * @returns {boolean}
   */
  const isUserOnline = useCallback((userId) => {
    return onlineFriends.has(userId);
  }, [onlineFriends]);

  /**
   * Check if a user is typing in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  const isUserTyping = useCallback((conversationId, userId) => {
    const key = `${conversationId}-${userId}`;
    const typingData = typingUsers.get(key);
    
    if (!typingData) return false;
    
    // Clear typing status after 3 seconds
    if (Date.now() - typingData.timestamp > 3000) {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
      return false;
    }
    
    return true;
  }, [typingUsers]);

  /**
   * Send a message
   * @param {Object} messageData - Message data
   */
  const sendMessage = useCallback((messageData) => {
    return socketService.sendMessage(messageData);
  }, []);

  /**
   * Start typing in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} receiverId - Receiver ID
   */
  const startTyping = useCallback((conversationId, receiverId) => {
    socketService.startTyping({ conversationId, receiverId });
  }, []);

  /**
   * Stop typing in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} receiverId - Receiver ID
   */
  const stopTyping = useCallback((conversationId, receiverId) => {
    socketService.stopTyping({ conversationId, receiverId });
  }, []);

  /**
   * Mark messages as read
   * @param {Array} messageIds - Array of message IDs
   * @param {string} conversationId - Conversation ID
   */
  const markMessagesAsRead = useCallback((messageIds, conversationId) => {
    socketService.markAsRead({ messageIds, conversationId });
  }, []);

  /**
   * Add reaction to message
   * @param {string} messageId - Message ID
   * @param {string} emoji - Emoji to add
   */
  const addReaction = useCallback((messageId, emoji) => {
    socketService.addReaction({ messageId, emoji });
  }, []);

  const value = {
    socket: socketService,
    isConnected,
    socketId,
    onlineFriends,
    isUserOnline,
    isUserTyping,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    addReaction,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;