import React from 'react';
import { FiMoreVertical, FiPhone, FiVideo, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

const ChatHeader = ({ conversation, user, onBack }) => {
  const navigate = useNavigate();
  const { isUserOnline } = useSocket();

  const getDisplayName = () => {
    if (conversation?.isGroupChat) {
      return conversation.groupName || 'Group Chat';
    }
    // For 1-on-1 chat, get the other participant's name
    const otherParticipant = conversation?.participants?.find(
      p => p._id !== user?._id
    );
    return otherParticipant?.name || 'Unknown User';
  };

  const getDisplayAvatar = () => {
    if (conversation?.isGroupChat) {
      return conversation.groupIcon || null;
    }
    const otherParticipant = conversation?.participants?.find(
      p => p._id !== user?._id
    );
    return otherParticipant?.profilePic || null;
  };

  const isOnline = () => {
    if (conversation?.isGroupChat) return false;
    const otherParticipant = conversation?.participants?.find(
      p => p._id !== user?._id
    );
    return otherParticipant ? isUserOnline(otherParticipant._id) : false;
  };

  const getParticipantCount = () => {
    return conversation?.participants?.length || 0;
  };

  return (
    <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center flex-1">
        {/* Back button (mobile) */}
        <button
          onClick={onBack || (() => navigate(-1))}
          className="lg:hidden mr-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FiArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Avatar */}
        <div className="relative">
          {getDisplayAvatar() ? (
            <img
              src={getDisplayAvatar()}
              alt={getDisplayName()}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {getDisplayName().charAt(0)}
            </div>
          )}
          {isOnline() && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        {/* Info */}
        <div className="ml-3">
          <h2 className="font-semibold text-gray-800">{getDisplayName()}</h2>
          <p className="text-xs text-gray-500">
            {conversation?.isGroupChat 
              ? `${getParticipantCount()} participants`
              : isOnline() 
                ? 'Online' 
                : 'Offline'
            }
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <FiPhone className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <FiVideo className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <FiMoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;