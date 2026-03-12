import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS, ERROR_MESSAGES } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🚀 [API] ${config.method.toUpperCase()} ${config.baseURL}${config.path}`, config);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ [API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log('✅ [API] Response:', response.data);
    }
    return response.data;
  },
  (error) => {
    // Handle errors
    let errorMessage = ERROR_MESSAGES.DEFAULT;
    let errorData = {};

    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please try again.';
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.response) {
      // Server responded with error status
      errorData = error.response.data;
      
      switch (error.response.status) {
        case 400:
          errorMessage = errorData.message || 'Bad request';
          break;
        case 401:
          errorMessage = errorData.message || ERROR_MESSAGES.UNAUTHORIZED;
          // Clear invalid token
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          // Redirect to login if not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
        case 403:
          errorMessage = errorData.message || ERROR_MESSAGES.FORBIDDEN;
          break;
        case 404:
          errorMessage = errorData.message || ERROR_MESSAGES.NOT_FOUND;
          break;
        case 422:
        case 400:
          errorMessage = errorData.message || ERROR_MESSAGES.VALIDATION_ERROR;
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = errorData.message || ERROR_MESSAGES.SERVER_ERROR;
          break;
        default:
          errorMessage = errorData.message || ERROR_MESSAGES.DEFAULT;
      }
      
      console.error('❌ [API] Error Response:', {
        status: error.response.status,
        data: error.response.data,
        message: errorMessage
      });
    } else if (error.request) {
      // Request made but no response
      console.error('❌ [API] No Response:', error.request);
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      // Something else happened
      console.error('❌ [API] Error:', error.message);
      errorMessage = error.message;
    }

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: errorData,
      originalError: error
    });
  }
);

// Helper methods for common requests
export const apiGet = (url, config = {}) => api.get(url, config);
export const apiPost = (url, data, config = {}) => api.post(url, data, config);
export const apiPut = (url, data, config = {}) => api.put(url, data, config);
export const apiDelete = (url, config = {}) => api.delete(url, config);
export const apiUpload = (url, formData, config = {}) => {
  return api.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  });
};

export default api;