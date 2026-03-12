import React, { useState } from 'react';  // Add this line at the top!
import { FiMoreVertical, FiMessageSquare, FiUserMinus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import useFriendStore from '../../store/friendStore';
import { formatMessageTime } from '../../utils/helpers';
import toast from 'react-hot-toast';


const FriendList = ({ friends = [] }) => {
  const navigate = useNavigate();
  const { isUserOnline } = useSocket();
  const { removeFriend } = useFriendStore();
  const [showMenu, setShowMenu] = useState(null);

  const handleMessage = (friend) => {
    navigate(`/chat/${friend.conversationId}`);
  };

  const handleRemoveFriend = async (friendId) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      try {
        await removeFriend(friendId);
        toast.success('Friend removed');
      } catch (error) {
        // Error handled in store
      }
    }
    setShowMenu(null);
  };

  const getAvatarUrl = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No friends yet</h3>
        <p className="text-gray-500 mb-4">Start adding friends to chat with them!</p>
        <button
          onClick={() => navigate('/friends/add')}
          className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Find Friends
        </button>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {friends.map((friend) => (
        <div
          key={friend._id}
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            {/* Avatar with online status */}
            <div className="relative">
              <img
                src={friend.profilePic || getAvatarUrl(friend.name)}
                alt={friend.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {isUserOnline(friend._id) && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>

            {/* Friend info */}
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">{friend.name}</h3>
              <p className="text-sm text-gray-500">
                {friend.lastMessage?.content 
                  ? friend.lastMessage.content.substring(0, 30) + (friend.lastMessage.content.length > 30 ? '...' : '')
                  : 'No messages yet'}
              </p>
              {friend.lastMessage && (
                <p className="text-xs text-gray-400 mt-1">
                  {formatMessageTime(friend.lastMessage.createdAt)}
                </p>
              )}
            </div>

            {/* Unread count badge */}
            {friend.unreadCount > 0 && (
              <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {friend.unreadCount}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleMessage(friend)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Send message"
            >
              <FiMessageSquare className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(showMenu === friend._id ? null : friend._id)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiMoreVertical className="w-4 h-4" />
              </button>

              {showMenu === friend._id && (
                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border py-1 z-10">
                  <button
                    onClick={() => handleRemoveFriend(friend._id)}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <FiUserMinus className="mr-2" /> Remove Friend
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FriendList;