// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5007';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  SIGNUP: '/api/auth/signup',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  
  // Users
  GET_PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/profile',
  SEARCH_USERS: '/api/users/search',
  GET_USER: (id) => `/api/users/${id}`,
  FRIEND_SUGGESTIONS: '/api/users/friends/suggestions',
  
  // Friends
  SEND_FRIEND_REQUEST: '/api/friends/request',
  ACCEPT_FRIEND_REQUEST: (id) => `/api/friends/accept/${id}`,
  REJECT_FRIEND_REQUEST: (id) => `/api/friends/reject/${id}`,
  GET_FRIEND_REQUESTS: '/api/friends/requests',
  GET_FRIENDS: '/api/friends',
  REMOVE_FRIEND: (id) => `/api/friends/${id}`,
  
  // Messages
  GET_MESSAGES: (conversationId) => `/api/messages/${conversationId}`,
  SEND_MESSAGE: '/api/messages',
  MARK_AS_READ: (id) => `/api/messages/${id}/read`,
  ADD_REACTION: (id) => `/api/messages/${id}/reaction`,
  DELETE_MESSAGE: (id) => `/api/messages/${id}`,
  
  // Uploads
  UPLOAD_PROFILE_PIC: '/api/upload/profile-pic',
  UPLOAD_CHAT_IMAGE: '/api/upload/chat-image',
  UPLOAD_CHAT_FILE: '/api/upload/chat-file',
  UPLOAD_MULTIPLE: '/api/upload/multiple',
  
  // AI
  SPELL_CHECK: '/api/ai/spell-check',
  SENTIMENT_ANALYSIS: '/api/ai/sentiment',
  SMART_REPLIES: '/api/ai/smart-replies',
  SUMMARIZE: '/api/ai/summarize',
  MODERATE: '/api/ai/moderate',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'adda_token',
  USER: 'adda_user',
  THEME: 'adda_theme',
};

// App Constants
export const APP_CONFIG = {
  APP_NAME: 'AddA',
  APP_VERSION: '1.0.0',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
  ],
  TYPING_TIMEOUT: 1000, // 1 second
  DEBOUNCE_DELAY: 500, // 500ms
  MESSAGE_PAGE_SIZE: 50,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  DEFAULT: 'Something went wrong. Please try again.',
};

// Toast Messages
export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  LOGIN_ERROR: 'Invalid email or password',
  SIGNUP_SUCCESS: 'Account created successfully!',
  SIGNUP_ERROR: 'Failed to create account',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  FRIEND_REQUEST_SENT: 'Friend request sent',
  FRIEND_REQUEST_ACCEPTED: 'Friend request accepted',
  MESSAGE_SENT: 'Message sent',
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'File type not supported',
};

// Socket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Message events
  SEND_MESSAGE: 'sendMessage',
  RECEIVE_MESSAGE: 'receiveMessage',
  EDIT_MESSAGE: 'editMessage',
  DELETE_MESSAGE: 'deleteMessage',
  MARK_AS_READ: 'markAsRead',
  MESSAGES_READ: 'messagesRead',
  ADD_REACTION: 'addReaction',
  REACTION_UPDATED: 'reactionUpdated',
  
  // Typing events
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  USER_TYPING: 'userTyping',
  
  // Presence events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  FRIEND_ONLINE: 'friend:online',
  FRIEND_OFFLINE: 'friend:offline',
  
  // Friend events
  FRIEND_REQUEST: 'friendRequest',
  FRIEND_ACCEPTED: 'friendAccepted',
  FRIEND_REMOVED: 'friendRemoved',
};