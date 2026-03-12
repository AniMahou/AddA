import React, { useEffect } from 'react';
import { FiUserPlus } from 'react-icons/fi';
import useFriendStore from '../../store/friendStore';
import { getAvatarUrl } from '../../utils/helpers';

const FriendSuggestions = () => {
  const { suggestions, loadSuggestions, sendFriendRequest } = useFriendStore();

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleAddFriend = async (userId) => {
    try {
      await sendFriendRequest(userId);
    } catch (error) {
      // Error handled in store
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 mb-3">PEOPLE YOU MAY KNOW</h3>
      <div className="space-y-3">
        {suggestions.slice(0, 5).map((user) => (
          <div
            key={user._id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <img
                src={user.profilePic || getAvatarUrl(user.name)}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h4 className="font-medium text-gray-800">{user.name}</h4>
                {user.mutualFriends > 0 && (
                  <p className="text-xs text-gray-500">
                    {user.mutualFriends} mutual friend{user.mutualFriends !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => handleAddFriend(user._id)}
              className="p-2 text-primary-600 hover:bg-primary-100 rounded-full transition-colors"
              title="Add friend"
            >
              <FiUserPlus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendSuggestions;