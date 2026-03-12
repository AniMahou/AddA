import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiMoreVertical } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { formatMessageTime, truncateText } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';


const ChatSidebar = ({ 
  conversations = [], 
  currentConversation,
  onSelectConversation,
  unreadCounts = {},
  onSearch
}) => {

  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conv => {
      if (conv.isGroupChat) {
        return conv.groupName?.toLowerCase().includes(searchTerm.toLowerCase());
      }
      const otherParticipant = conv.participants?.find(p => p._id !== user?._id);
      return otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredConversations(filtered);
  }, [searchTerm, conversations, user]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
  };

  const getConversationName = (conversation) => {
    if (conversation.isGroupChat) {
      return conversation.groupName || 'Group Chat';
    }
    const otherParticipant = conversation.participants?.find(p => p._id !== user?._id);
    return otherParticipant?.name || 'Unknown User';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.isGroupChat) {
      return conversation.groupIcon || null;
    }
    const otherParticipant = conversation.participants?.find(p => p._id !== user?._id);
    return otherParticipant?.profilePic || null;
  };

  const getInitials = (name) => {
    return name?.charAt(0) || '?';
  };

  const isOnline = (conversation) => {
    if (conversation.isGroupChat) return false;
    const otherParticipant = conversation.participants?.find(p => p._id !== user?._id);
    return otherParticipant ? isUserOnline(otherParticipant._id) : false;
  };

  return (
    <div className="w-full h-full bg-white border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          Chats
        </h1>
        <div className="mt-2 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search conversations..."
            className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
        </div>
      </div>

        {/* New chat button */}
        <div className="px-4 py-2">
        <button
            onClick={() => navigate('/friends/add')}
            className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg py-2 px-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
            <FiPlus className="w-5 h-5" />
            Find Friends
        </button>
        </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start a new chat!</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isSelected = currentConversation?._id === conversation._id;
            const unreadCount = unreadCounts[conversation._id] || 0;
            const name = getConversationName(conversation);
            const avatar = getConversationAvatar(conversation);
            const online = isOnline(conversation);

            return (
              <div
                key={conversation._id}
                onClick={() => onSelectConversation(conversation)}
                className={`
                  flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors
                  ${isSelected ? 'bg-primary-50' : ''}
                  ${unreadCount > 0 ? 'font-semibold' : ''}
                `}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(name)}
                    </div>
                  )}
                  {online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                {/* Info */}
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-gray-800 truncate ${unreadCount > 0 ? 'font-bold' : ''}`}>
                      {name}
                    </h3>
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatMessageTime(conversation.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessagePreview || 'No messages yet'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu button */}
                <button className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <FiMoreVertical className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;