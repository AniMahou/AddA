import { create } from 'zustand';
import messageService from '../services/messageService';

const useChatStore = create((set, get) => ({
  // State
  conversations: [],
  currentConversation: null,
  messages: {},
  loading: false,
  error: null,
  unreadCounts: {},
  hasMoreMessages: {},
  typingUsers: {},

  // Load all conversations
  loadConversations: async () => {
    set({ loading: true, error: null });
    try {
      const conversations = await messageService.getConversations();
      set({ conversations, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Select a conversation
  selectConversation: (conversation) => {
    set({ currentConversation: conversation });
    // Reset unread count for this conversation
    if (conversation) {
      get().markConversationAsRead(conversation._id);
    }
  },

  // Load messages for a conversation
  loadMessages: async (conversationId, options = {}) => {
    const { page = 1, limit = 50, before = null } = options;
    const messagesKey = `${conversationId}`;
    
    set({ loading: true, error: null });
    try {
      const response = await messageService.getMessages(conversationId, { page, limit, before });
      
      set((state) => ({
        messages: {
          ...state.messages,
          [messagesKey]: page === 1 
            ? response.data 
            : [...(state.messages[messagesKey] || []), ...response.data]
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [conversationId]: response.pagination?.hasMore || false
        },
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Add a new message to the store
  addMessage: (message) => {
    const conversationId = message.conversation;
    const messagesKey = `${conversationId}`;
    
    set((state) => {
      // Update messages list
      const currentMessages = state.messages[messagesKey] || [];
      const messageExists = currentMessages.some(m => m._id === message._id);
      
      const newMessages = messageExists 
        ? currentMessages.map(m => m._id === message._id ? message : m)
        : [...currentMessages, message];

      // Update conversation last message
      const updatedConversations = state.conversations.map(conv => {
        if (conv._id === conversationId) {
          return {
            ...conv,
            lastMessage: message,
            lastMessageTime: message.createdAt
          };
        }
        return conv;
      });

      // Increment unread count if not current conversation
      let unreadCounts = { ...state.unreadCounts };
      if (state.currentConversation?._id !== conversationId) {
        unreadCounts[conversationId] = (unreadCounts[conversationId] || 0) + 1;
      }

      // Sort conversations by last message time
      const sortedConversations = updatedConversations.sort((a, b) => {
        const timeA = a.lastMessageTime || a.updatedAt || 0;
        const timeB = b.lastMessageTime || b.updatedAt || 0;
        return new Date(timeB) - new Date(timeA);
      });

      return {
        messages: {
          ...state.messages,
          [messagesKey]: newMessages.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          )
        },
        conversations: sortedConversations,
        unreadCounts
      };
    });
  },

  // Update a message (edit, reaction, delete)
  updateMessage: (conversationId, messageId, updates) => {
    const messagesKey = `${conversationId}`;
    
    set((state) => ({
      messages: {
        ...state.messages,
        [messagesKey]: (state.messages[messagesKey] || []).map(msg =>
          msg._id === messageId ? { ...msg, ...updates } : msg
        )
      }
    }));
  },

  // Mark conversation as read
  markConversationAsRead: (conversationId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: 0
      }
    }));
  },

  // Update typing status
  setTyping: (conversationId, userId, isTyping) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: isTyping 
          ? [...(state.typingUsers[conversationId] || []), userId]
          : (state.typingUsers[conversationId] || []).filter(id => id !== userId)
      }
    }));
  },

  // Clear all messages
  clearMessages: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: {},
      unreadCounts: {},
      typingUsers: {}
    });
  },

  // Selectors
  getConversationMessages: (conversationId) => {
    return get().messages[`${conversationId}`] || [];
  },

  getUnreadCount: (conversationId) => {
    return get().unreadCounts[conversationId] || 0;
  },

  getTotalUnreadCount: () => {
    const state = get();
    return Object.values(state.unreadCounts).reduce((a, b) => a + b, 0);
  },

  isTyping: (conversationId, userId) => {
    const typingUsers = get().typingUsers[conversationId] || [];
    return typingUsers.includes(userId);
  }
}));

export default useChatStore;