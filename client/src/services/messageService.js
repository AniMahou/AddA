import api, { apiGet, apiPost, apiPut, apiDelete } from './api';
import { API_ENDPOINTS } from '../utils/constants';

class MessageService {
  /**
   * Get messages for a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} params - { page, limit, before }
   * @returns {Promise}
   */
  async getMessages(conversationId, params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.GET_MESSAGES(conversationId)}${queryParams ? `?${queryParams}` : ''}`;
      const response = await apiGet(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send a message
   * @param {Object} messageData - { receiverId, content, messageType, fileUrl, fileName, fileSize, replyTo }
   * @returns {Promise}
   */
  async sendMessage(messageData) {
    try {
      const response = await apiPost(API_ENDPOINTS.SEND_MESSAGE, messageData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   * @returns {Promise}
   */
  async markAsRead(messageId) {
    try {
      const response = await apiPut(API_ENDPOINTS.MARK_AS_READ(messageId));
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add reaction to message
   * @param {string} messageId - Message ID
   * @param {string} emoji - Emoji to add
   * @returns {Promise}
   */
  async addReaction(messageId, emoji) {
    try {
      const response = await apiPut(API_ENDPOINTS.ADD_REACTION(messageId), { emoji });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete message
   * @param {string} messageId - Message ID
   * @returns {Promise}
   */
  async deleteMessage(messageId) {
    try {
      const response = await apiDelete(API_ENDPOINTS.DELETE_MESSAGE(messageId));
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get conversation list for current user
   * @returns {Promise}
   */
  async getConversations() {
    try {
      const response = await apiGet('/api/conversations');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new conversation
   * @param {Array} participantIds - Array of user IDs
   * @param {boolean} isGroupChat - Whether it's a group chat
   * @param {string} groupName - Group name (for group chats)
   * @returns {Promise}
   */
  async createConversation(participantIds, isGroupChat = false, groupName = null) {
    try {
      const response = await apiPost('/api/conversations', {
        participantIds,
        isGroupChat,
        groupName
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

const messageService = new MessageService();
export default messageService;