import { create } from 'zustand';
import friendService from '../services/friendService';
import toast from 'react-hot-toast';

const useFriendStore = create((set, get) => ({
  // State
  friends: [],
  friendRequests: [],
  searchResults: [],
  suggestions: [],
  loading: false,
  error: null,
  searchLoading: false,

  // Load friends list
  loadFriends: async () => {
    set({ loading: true, error: null });
    try {
      const response = await friendService.getFriends();
      set({ friends: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error('Failed to load friends');
    }
  },

  // Load friend requests
  loadFriendRequests: async () => {
    set({ loading: true, error: null });
    try {
      const response = await friendService.getFriendRequests();
      set({ friendRequests: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error('Failed to load friend requests');
    }
  },

  // Load friend suggestions
  loadSuggestions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await friendService.getFriendSuggestions();
      set({ suggestions: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Search users
  searchUsers: async (query) => {
    if (!query || query.length < 2) {
      set({ searchResults: [] });
      return;
    }

    set({ searchLoading: true, error: null });
    try {
      const response = await friendService.searchUsers(query);
      set({ searchResults: response.data || [], searchLoading: false });
    } catch (error) {
      set({ error: error.message, searchLoading: false });
    }
  },

  // Send friend request
  sendFriendRequest: async (receiverId, message = '') => {
    try {
      const response = await friendService.sendFriendRequest(receiverId, message);
      
      // Update search results to show pending status
      set((state) => ({
        searchResults: state.searchResults.map(user => 
          user._id === receiverId 
            ? { ...user, hasPendingRequest: true }
            : user
        )
      }));
      
      toast.success('Friend request sent!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to send friend request');
      throw error;
    }
  },

  // Accept friend request
  acceptRequest: async (requestId) => {
    try {
      const response = await friendService.acceptFriendRequest(requestId);
      
      // Remove from requests and add to friends
      set((state) => ({
        friendRequests: state.friendRequests.filter(req => req._id !== requestId),
        friends: [...state.friends, response.data.friend]
      }));
      
      toast.success('Friend request accepted!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to accept request');
      throw error;
    }
  },

  // Reject friend request
  rejectRequest: async (requestId) => {
    try {
      await friendService.rejectFriendRequest(requestId);
      
      // Remove from requests
      set((state) => ({
        friendRequests: state.friendRequests.filter(req => req._id !== requestId)
      }));
      
      toast.success('Friend request rejected');
    } catch (error) {
      toast.error(error.message || 'Failed to reject request');
      throw error;
    }
  },

  // Remove friend
  removeFriend: async (friendId) => {
    try {
      await friendService.removeFriend(friendId);
      
      // Remove from friends list
      set((state) => ({
        friends: state.friends.filter(f => f._id !== friendId)
      }));
      
      toast.success('Friend removed');
    } catch (error) {
      toast.error(error.message || 'Failed to remove friend');
      throw error;
    }
  },

  // Clear search results
  clearSearch: () => {
    set({ searchResults: [] });
  },

  // Reset store
  reset: () => {
    set({
      friends: [],
      friendRequests: [],
      searchResults: [],
      suggestions: [],
      loading: false,
      error: null
    });
  },
  initSocketListeners: (socket) => {
    if (!socket) return;

    // Listen for incoming friend requests
    socket.onFriendRequestReceived((data) => {
      console.log('📨 Friend request received:', data);
      
      // Show notification
      toast.custom((t) => (
        <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-primary-500">
          <p className="font-medium">New Friend Request</p>
          <p className="text-sm text-gray-600">{data.senderName} wants to connect</p>
          <button
            onClick={() => {
              window.location.href = '/friends';
              toast.dismiss(t.id);
            }}
            className="mt-2 text-sm text-primary-600 font-medium"
          >
            View Request
          </button>
        </div>
      ), { duration: 5000 });

      // Refresh friend requests
      get().loadFriendRequests();
    });

    // Listen for friend request acceptance
    socket.onFriendRequestAccepted((data) => {
      console.log('✅ Friend request accepted:', data);
      
      toast.success(`${data.friendName} accepted your friend request!`);
      
      // Refresh friends list and requests
      get().loadFriends();
      get().loadFriendRequests();
    });
  },

  // Override sendFriendRequest to emit socket event
  sendFriendRequest: async (receiverId, message = '') => {
    try {
      const response = await friendService.sendFriendRequest(receiverId, message);
      
      // Update search results to show pending status
      set((state) => ({
        searchResults: state.searchResults.map(user => 
          user._id === receiverId 
            ? { ...user, hasPendingRequest: true }
            : user
        )
      }));
      
      // Emit socket event to notify receiver
      const { socket } = require('../context/SocketContext').useSocket();
      if (socket) {
        socket.emitFriendRequestSent({
          receiverId,
          requestId: response.data?._id,
          senderName: get().currentUser?.name
        });
      }
      
      toast.success('Friend request sent!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to send friend request');
      throw error;
    }
  },

  // Override acceptRequest to emit socket event
  acceptRequest: async (requestId) => {
    try {
      const response = await friendService.acceptFriendRequest(requestId);
      
      // Remove from requests and add to friends
      set((state) => ({
        friendRequests: state.friendRequests.filter(req => req._id !== requestId),
        friends: [...state.friends, response.data.friend]
      }));
      
      // Emit socket event to notify sender
      const { socket } = require('../context/SocketContext').useSocket();
      if (socket) {
        socket.emit('friendRequestAccepted', {
          receiverId: response.data.friend._id,
          friendName: response.data.friend.name
        });
      }
      
      toast.success('Friend request accepted!');
      return response;
    } catch (error) {
      toast.error(error.message || 'Failed to accept request');
      throw error;
    }
  },
}));

export default useFriendStore;