import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_EVENTS, STORAGE_KEYS } from '../utils/constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Connect to socket server
   * @param {string} token - JWT token for authentication
   * @returns {Promise}
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      try {
        if (this.socket?.connected) {
          console.log('🔵 Socket already connected');
          resolve(this.socket);
          return;
        }

        console.log('🔵 Connecting to socket server...');
        
        this.socket = io(API_BASE_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
        });

        // Connection events
        this.socket.on('connect', () => {
          console.log('✅ Socket connected:', this.socket.id);
          this.reconnectAttempts = 0;
          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error.message);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Failed to connect to socket server'));
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔴 Socket disconnected:', reason);
          if (reason === 'io server disconnect') {
            // Server disconnected, don't reconnect
            this.disconnect();
          }
        });

        this.socket.on('error', (error) => {
          console.error('❌ Socket error:', error);
        });

      } catch (error) {
        console.error('❌ Socket connection error:', error);
        reject(error);
      }
    });
  }


   //Disconnect socket

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('🔴 Socket disconnected manually');
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   * @returns {string|null}
   */
  getSocketId() {
    return this.socket?.id || null;
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected, cannot emit:', event);
      return false;
    }
    
    console.log('📤 Emitting event:', event, data);
    this.socket.emit(event, data);
    return true;
  }

  /**
   * Listen to an event
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('⚠️ Socket not initialized, cannot listen to:', event);
      return;
    }

    // Remove existing listener if any
    if (this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
    }

    this.listeners.set(event, callback);
    this.socket.on(event, callback);
    console.log('👂 Listening to event:', event);
  }

  /**
   * Remove listener for an event
   * @param {string} event - Event name
   */
  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
      console.log('🔇 Removed listener for:', event);
    }
  }


  removeAllListeners() {
    if (this.socket) {
      this.listeners.forEach((callback, event) => {
        this.socket.off(event, callback);
      });
      this.listeners.clear();
      console.log('🔇 Removed all listeners');
    }
  }



  /**
   * Send a message
   * @param {Object} data - { receiverId, content, messageType, fileUrl, fileName, fileSize, replyTo }
   */
  sendMessage(data) {
    return this.emit(SOCKET_EVENTS.SEND_MESSAGE, data);
  }

  /**
   * Listen for incoming messages
   * @param {Function} callback - (data) => {}
   */
  onMessageReceived(callback) {
    this.on(SOCKET_EVENTS.RECEIVE_MESSAGE, callback);
  }

  /**
   * Edit a message
   * @param {Object} data - { messageId, newContent }
   */
  editMessage(data) {
    return this.emit(SOCKET_EVENTS.EDIT_MESSAGE, data);
  }

  /**
   * Listen for message edits
   * @param {Function} callback - (data) => {}
   */
  onMessageEdited(callback) {
    this.on('messageEdited', callback);
  }

  /**
   * Delete a message
   * @param {Object} data - { messageId, deleteForEveryone }
   */
  deleteMessage(data) {
    return this.emit(SOCKET_EVENTS.DELETE_MESSAGE, data);
  }

  /**
   * Listen for message deletions
   * @param {Function} callback - (data) => {}
   */
  onMessageDeleted(callback) {
    this.on('messageDeleted', callback);
  }

  /**
   * Mark messages as read
   * @param {Object} data - { messageIds, conversationId }
   */
  markAsRead(data) {
    return this.emit(SOCKET_EVENTS.MARK_AS_READ, data);
  }

  /**
   * Listen for messages read receipts
   * @param {Function} callback - (data) => {}
   */
  onMessagesRead(callback) {
    this.on(SOCKET_EVENTS.MESSAGES_READ, callback);
  }

  /**
   * Add reaction to message
   * @param {Object} data - { messageId, emoji }
   */
  addReaction(data) {
    return this.emit(SOCKET_EVENTS.ADD_REACTION, data);
  }

  /**
   * Listen for reaction updates
   * @param {Function} callback - (data) => {}
   */
  onReactionUpdated(callback) {
    this.on('reactionUpdated', callback);
  }


  /**
   * Start typing
   * @param {Object} data - { conversationId, receiverId }
   */
  startTyping(data) {
    return this.emit(SOCKET_EVENTS.TYPING_START, data);
  }

  /**
   * Stop typing
   * @param {Object} data - { conversationId, receiverId }
   */
  stopTyping(data) {
    return this.emit(SOCKET_EVENTS.TYPING_STOP, data);
  }

  /**
   * Send typing status
   * @param {Object} data - { conversationId, receiverId, isTyping }
   */
  sendTypingStatus(data) {
    return this.emit(SOCKET_EVENTS.USER_TYPING, data);
  }

  /**
   * Listen for typing status
   * @param {Function} callback - (data) => {}
   */
  onUserTyping(callback) {
    this.on(SOCKET_EVENTS.USER_TYPING, callback);
  }

  // ==================== Presence Events ====================

  /**
   * Mark user as online
   */
  goOnline() {
    return this.emit(SOCKET_EVENTS.USER_ONLINE, {});
  }

  /**
   * Mark user as offline
   */
  goOffline() {
    return this.emit(SOCKET_EVENTS.USER_OFFLINE, {});
  }

  /**
   * Listen for friend online status
   * @param {Function} callback - (data) => {}
   */
  onFriendOnline(callback) {
    this.on('friend:online', callback);
  }

  /**
   * Listen for friend offline status
   * @param {Function} callback - (data) => {}
   */
  onFriendOffline(callback) {
    this.on('friend:offline', callback);
  }

  /**
   * Check user status
   * @param {string} userId - User ID to check
   */
  checkUserStatus(userId) {
    return this.emit('user:status', { userId });
  }

  /**
   * Listen for status response
   * @param {Function} callback - (data) => {}
   */
  onUserStatus(callback) {
    this.on('user:status:response', callback);
  }

  /**
   * Get all online friends
   */
  getOnlineFriends() {
    return this.emit('friends:online', {});
  }

  /**
   * Listen for online friends response
   * @param {Function} callback - (data) => {}
   */
  onOnlineFriends(callback) {
    this.on('friends:online:response', callback);
  }

  /**
   * Listen for friend requests
   * @param {Function} callback - (data) => {}
   */
  onFriendRequest(callback) {
    this.on('friendRequest', callback);
  }

  /**
   * Listen for friend request acceptance
   * @param {Function} callback - (data) => {}
   */
  onFriendAccepted(callback) {
    this.on('friendAccepted', callback);
  }

  /**
   * Listen for friend removal
   * @param {Function} callback - (data) => {}
   */
  onFriendRemoved(callback) {
    this.on('friendRemoved', callback);
  }

/**
 * Listen for friend request received
 * @param {Function} callback - (data) => {}
 */
onFriendRequestReceived(callback) {
    this.on('friendRequest', callback);
  }
  
  /**
   * Listen for friend request accepted
   * @param {Function} callback - (data) => {}
   */
  onFriendRequestAccepted(callback) {
    this.on('friendRequestAccepted', callback);
  }
  
  /**
   * Emit friend request sent (to notify receiver)
   * @param {Object} data - { receiverId, requestId, senderName }
   */
  emitFriendRequestSent(data) {
    return this.emit('friendRequest', data);
  }
}

// Create and export singleton instance
const socketService = new SocketService();
export default socketService;