import api, { apiGet, apiPost, apiPut, apiDelete } from './api';
import { API_ENDPOINTS } from '../utils/constants';

class FriendService {
  /**
   * Search for users
   * @param {string} query - Search query
   * @param {number} page - Page number
   * @returns {Promise}
   */
  async searchUsers(query, page = 1) {
    try {
      const response = await apiGet(`${API_ENDPOINTS.SEARCH_USERS}?q=${encodeURIComponent(query)}&page=${page}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send friend request
   * @param {string} receiverId - User ID to send request to
   * @param {string} message - Optional message
   * @returns {Promise}
   */
  async sendFriendRequest(receiverId, message = '') {
    try {
      const response = await apiPost(API_ENDPOINTS.SEND_FRIEND_REQUEST, { receiverId, message });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all pending friend requests
   * @returns {Promise}
   */
  async getFriendRequests() {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_FRIEND_REQUESTS);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Accept friend request
   * @param {string} requestId - Friend request ID
   * @returns {Promise}
   */
  async acceptFriendRequest(requestId) {
    try {
      const response = await apiPut(API_ENDPOINTS.ACCEPT_FRIEND_REQUEST(requestId));
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject friend request
   * @param {string} requestId - Friend request ID
   * @returns {Promise}
   */
  async rejectFriendRequest(requestId) {
    try {
      const response = await apiPut(API_ENDPOINTS.REJECT_FRIEND_REQUEST(requestId));
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get friends list
   * @returns {Promise}
   */
  async getFriends() {
    try {
      const response = await apiGet(API_ENDPOINTS.GET_FRIENDS);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove friend
   * @param {string} friendId - Friend ID to remove
   * @returns {Promise}
   */
  async removeFriend(friendId) {
    try {
      const response = await apiDelete(API_ENDPOINTS.REMOVE_FRIEND(friendId));
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get friend suggestions
   * @returns {Promise}
   */
  async getFriendSuggestions() {
    try {
      const response = await apiGet(API_ENDPOINTS.FRIEND_SUGGESTIONS);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

const friendService = new FriendService();
export default friendService;