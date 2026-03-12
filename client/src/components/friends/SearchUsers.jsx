import React, { useState, useEffect } from 'react';
import { FiSearch, FiUserPlus, FiCheck, FiX } from 'react-icons/fi';
import { useDebounce } from '../../hooks/useDebounce';
import useFriendStore from '../../store/friendStore';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const SearchUsers = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const {
    searchResults,
    searchLoading,
    searchUsers,
    sendFriendRequest,
    clearSearch
  } = useFriendStore();

  useEffect(() => {
    if (debouncedSearch) {
      searchUsers(debouncedSearch);
    } else {
      clearSearch();
    }
  }, [debouncedSearch, searchUsers, clearSearch]);

  const handleSendRequest = async () => {
    if (!selectedUser) return;
    
    try {
      await sendFriendRequest(selectedUser._id, message);
      setSelectedUser(null);
      setMessage('');
      setSearchTerm('');
      onClose?.();
    } catch (error) {
      // Error is handled in store
    }
  };

  const getAvatarUrl = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Add Friends</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          </div>
        </div>

        {/* Search results */}
        <div className="flex-1 overflow-y-auto max-h-[400px] p-4 pt-0">
          {searchLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profilePic || getAvatarUrl(user.name)}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium text-gray-800">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  {user.isFriend ? (
                    <span className="text-green-600 text-sm flex items-center gap-1">
                      <FiCheck /> Friends
                    </span>
                  ) : user.hasPendingRequest ? (
                    <span className="text-orange-600 text-sm">Pending</span>
                  ) : (
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                    >
                      <FiUserPlus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : searchTerm.length >= 2 ? (
            <p className="text-center text-gray-500 py-8">No users found</p>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Type at least 2 characters to search
            </p>
          )}
        </div>

        {/* Send request modal */}
        {selectedUser && (
          <div className="border-t p-4">
            <h3 className="font-medium mb-2">
              Send friend request to {selectedUser.name}
            </h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message (optional)"
              className="w-full border rounded-lg p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="2"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSendRequest}
                variant="primary"
                size="sm"
                fullWidth
              >
                Send Request
              </Button>
              <Button
                onClick={() => setSelectedUser(null)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUsers;