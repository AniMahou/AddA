import api, { apiPost } from './api';
import { API_ENDPOINTS } from '../utils/constants';

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - { name, email, password }
   * @returns {Promise} - { success, message, data: { _id, name, email, profilePic, token } }
   */
  async signup(userData) {
    try {
      const response = await apiPost(API_ENDPOINTS.SIGNUP, userData);
      return response; // Return full response
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise} - { success, message, data: { _id, name, email, profilePic, token } }
   */
  async login(credentials) {
    try {
      const response = await apiPost(API_ENDPOINTS.LOGIN, credentials);
      return response; // Return full response
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user
   * @param {string} token - JWT token
   * @returns {Promise}
   */
  async logout(token) {
    try {
      const response = await apiPost(API_ENDPOINTS.LOGOUT, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise}
   */
  async forgotPassword(email) {
    try {
      const response = await apiPost(API_ENDPOINTS.FORGOT_PASSWORD, { email });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise}
   */
  async resetPassword(token, password) {
    try {
      const response = await apiPost(API_ENDPOINTS.RESET_PASSWORD.replace(':token', token), { password });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>}
   */
  async checkEmailExists(email) {
    try {
      const response = await apiPost('/api/auth/check-email', { email });
      return response.exists;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh token
   * @param {string} token - Current token
   * @returns {Promise<{ token: string }>}
   */
  async refreshToken(token) {
    try {
      const response = await apiPost('/api/auth/refresh-token', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;