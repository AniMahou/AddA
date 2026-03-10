// User roles
export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator'
  };
  
  // Message types
  export const MESSAGE_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    AUDIO: 'audio',
    VIDEO: 'video'
  };
  
  // Message status
  export const MESSAGE_STATUS = {
    SENDING: 'sending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    FAILED: 'failed'
  };
  
  // Friend request status
  export const FRIEND_REQUEST_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  };
  
  // Notification types
  export const NOTIFICATION_TYPES = {
    FRIEND_REQUEST: 'friend_request',
    FRIEND_ACCEPTED: 'friend_request_accepted',
    NEW_MESSAGE: 'new_message',
    MENTION: 'mention',
    REPLY: 'reply',
    REACTION: 'reaction',
    GROUP_INVITE: 'group_invite',
    CALL: 'call'
  };
  
  // Notification priorities
  export const NOTIFICATION_PRIORITIES = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high'
  };
  
  // File upload limits (in bytes)
  export const FILE_UPLOAD_LIMITS = {
    PROFILE_PIC: 2 * 1024 * 1024, // 2MB
    CHAT_IMAGE: 5 * 1024 * 1024,   // 5MB
    CHAT_FILE: 10 * 1024 * 1024,   // 10MB
    CHAT_AUDIO: 10 * 1024 * 1024,  // 10MB
    CHAT_VIDEO: 50 * 1024 * 1024   // 50MB
  };
  
  // Allowed file types
  export const ALLOWED_FILE_TYPES = {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf'
    ],
    ARCHIVES: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg']
  };
  
  // Rate limits
  export const RATE_LIMITS = {
    API: { window: 15 * 60 * 1000, max: 100 }, // 15 minutes, 100 requests
    AUTH: { window: 60 * 60 * 1000, max: 5 },   // 1 hour, 5 attempts
    MESSAGE: { window: 60 * 1000, max: 30 },     // 1 minute, 30 messages
    UPLOAD: { window: 60 * 60 * 1000, max: 10 }, // 1 hour, 10 uploads
    AI: { window: 24 * 60 * 60 * 1000, max: 50 } // 1 day, 50 AI requests
  };
  
  // Pagination defaults
  export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  };
  
  // Cache durations (in seconds)
  export const CACHE_DURATIONS = {
    USER_PROFILE: 300,        // 5 minutes
    FRIEND_LIST: 60,          // 1 minute
    RECENT_MESSAGES: 3600,    // 1 hour
    CONVERSATION_LIST: 300    // 5 minutes
  };
  
  // WebSocket events
  export const SOCKET_EVENTS = {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    
    // Message events
    SEND_MESSAGE: 'sendMessage',
    RECEIVE_MESSAGE: 'receiveMessage',
    EDIT_MESSAGE: 'editMessage',
    DELETE_MESSAGE: 'deleteMessage',
    MARK_READ: 'markAsRead',
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
    FRIEND_REMOVED: 'friendRemoved'
  };
  
  // Error codes
  export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_KEY: 'DUPLICATE_KEY',
    RATE_LIMIT: 'RATE_LIMIT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    BAD_REQUEST: 'BAD_REQUEST'
  };
  
  // Default values
  export const DEFAULTS = {
    PROFILE_PIC: 'https://ui-avatars.com/api/?name=User&background=random',
    GROUP_ICON: 'https://ui-avatars.com/api/?name=Group&background=random',
    BIO: '',
    ONLINE: false,
    IS_ACTIVE: true
  };
  
  // Time constants (in milliseconds)
  export const TIME = {
    ONE_MINUTE: 60 * 1000,
    FIVE_MINUTES: 5 * 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    ONE_DAY: 24 * 60 * 60 * 1000,
    ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
    ONE_MONTH: 30 * 24 * 60 * 60 * 1000
  };