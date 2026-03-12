import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Hook for managing socket events in a component
 * @param {string} event - Event name to listen to
 * @param {Function} handler - Event handler
 */
export const useSocketEvent = (event, handler) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !event || !handler) return;

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
};

/**
 * Hook for managing message events
 * @param {Function} onMessageReceived - Callback for received messages
 */
export const useMessageEvents = (onMessageReceived) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    if (onMessageReceived) {
      socket.onMessageReceived(onMessageReceived);
    }

    return () => {
      if (onMessageReceived) {
        socket.off('receiveMessage');
      }
    };
  }, [socket, onMessageReceived]);
};

/**
 * Hook for managing typing events
 * @param {string} conversationId - Conversation ID
 */
export const useTypingEvents = (conversationId) => {
  const { socket, isUserTyping } = useSocket();
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleTyping = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => {
          if (data.isTyping && !prev.includes(data.userId)) {
            return [...prev, data.userId];
          } else if (!data.isTyping) {
            return prev.filter(id => id !== data.userId);
          }
          return prev;
        });
      }
    };

    socket.onUserTyping(handleTyping);

    return () => {
      socket.off('userTyping', handleTyping);
    };
  }, [socket, conversationId]);

  const isTyping = useCallback((userId) => {
    return isUserTyping(conversationId, userId);
  }, [conversationId, isUserTyping]);

  return { typingUsers, isTyping };
};

/**
 * Hook for managing presence (online/offline) events
 */
export const usePresenceEvents = () => {
  const { socket, isUserOnline } = useSocket();
  const [onlineStatus, setOnlineStatus] = useState({});

  useEffect(() => {
    if (!socket) return;

    const handleFriendOnline = ({ userId }) => {
      setOnlineStatus(prev => ({ ...prev, [userId]: true }));
    };

    const handleFriendOffline = ({ userId }) => {
      setOnlineStatus(prev => ({ ...prev, [userId]: false }));
    };

    socket.onFriendOnline(handleFriendOnline);
    socket.onFriendOffline(handleFriendOffline);

    return () => {
      socket.off('friend:online', handleFriendOnline);
      socket.off('friend:offline', handleFriendOffline);
    };
  }, [socket]);

  const isOnline = useCallback((userId) => {
    return onlineStatus[userId] ?? isUserOnline(userId);
  }, [onlineStatus, isUserOnline]);

  return { onlineStatus, isOnline };
};

/**
 * Hook for sending typing indicators
 * @param {string} conversationId - Conversation ID
 * @param {string} receiverId - Receiver ID
 */
export const useTypingIndicator = (conversationId, receiverId) => {
  const { startTyping, stopTyping } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = React.useRef(null);

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      startTyping(conversationId, receiverId);
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to stop typing
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(conversationId, receiverId);
    }, 2000);
  }, [conversationId, receiverId, isTyping, startTyping, stopTyping]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        stopTyping(conversationId, receiverId);
      }
    };
  }, [conversationId, receiverId, stopTyping]);

  return handleTyping;
};

export default useSocketEvent;