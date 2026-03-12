import React, { useState } from 'react';
import { formatMessageTime, formatFileSize } from '../../utils/helpers';
import { FiDownload, FiMoreVertical, FiEdit2, FiTrash2, FiCopy } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const MessageBubble = ({ 
  message, 
  isOwn, 
  onReaction, 
  onDelete, 
  onEdit,
  showAvatar = true,
  showStatus = true 
}) => {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = (emoji) => {
    onReaction?.(message._id, emoji);
    setShowReactions(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Message copied to clipboard');
  };

  const renderContent = () => {
    switch (message.messageType) {
      case 'text':
        return <p className="whitespace-pre-wrap break-words">{message.content}</p>;

      case 'image':
        return (
          <div className="mt-1">
            <img 
              src={message.fileUrl} 
              alt={message.fileName || 'Image'}
              className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
            {message.content && (
              <p className="mt-1 text-sm opacity-90">{message.content}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="mt-1">
            <a 
              href={message.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{message.fileName || 'File'}</p>
                <p className="text-xs opacity-75">{formatFileSize(message.fileSize)}</p>
              </div>
              <FiDownload className="ml-2 flex-shrink-0" />
            </a>
            {message.content && (
              <p className="mt-1 text-sm opacity-90">{message.content}</p>
            )}
          </div>
        );

      default:
        return <p>{message.content}</p>;
    }
  };

  const renderReactions = () => {
    if (!message.reactions?.length) return null;

    // Group reactions by emoji
    const reactionGroups = message.reactions.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className={`flex gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {Object.entries(reactionGroups).map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => onReaction?.(message._id, emoji)}
            className={`text-sm px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ${
              message.reactions?.some(r => r.user === user?._id && r.emoji === emoji)
                ? 'ring-2 ring-primary-500'
                : ''
            }`}
          >
            {emoji} {count > 1 && count}
          </button>
        ))}
      </div>
    );
  };

  const renderStatus = () => {
    if (!showStatus || !isOwn) return null;

    const statusIcons = {
      sending: '⏳',
      sent: '✓',
      delivered: '✓✓',
      read: '👁️'
    };

    return (
      <span className="text-xs opacity-50 ml-1" title={`Status: ${message.status}`}>
        {statusIcons[message.status] || '✓'}
      </span>
    );
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* Avatar for received messages */}
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0 mr-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {message.sender?.name?.charAt(0) || '?'}
          </div>
        </div>
      )}

      {/* Message bubble */}
      <div className={`max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
        {/* Sender name for group chats */}
        {!isOwn && message.sender?.name && (
          <p className="text-xs text-gray-600 mb-1 ml-1">
            {message.sender.name}
          </p>
        )}

        {/* Message actions */}
        {isOwn && (
          <div className="relative flex justify-end mb-1">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiMoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            
            {showActions && (
              <div className="absolute top-6 right-0 bg-white rounded-lg shadow-lg border py-1 z-10">
                <button
                  onClick={() => {
                    handleCopy();
                    setShowActions(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiCopy className="mr-2" /> Copy
                </button>
                <button
                  onClick={() => {
                    onEdit?.(message);
                    setShowActions(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiEdit2 className="mr-2" /> Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this message?')) {
                      onDelete?.(message._id);
                    }
                    setShowActions(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <FiTrash2 className="mr-2" /> Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* Message content */}
        <div
          className={`
            relative group message-bubble
            ${isOwn ? 'message-bubble-sent' : 'message-bubble-received'}
          `}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {renderContent()}
          
          {/* Message time and status */}
          <div className={`flex items-center justify-end mt-1 text-xs ${
            isOwn ? 'text-primary-100' : 'text-gray-500'
          }`}>
            <span>{formatMessageTime(message.createdAt)}</span>
            {renderStatus()}
          </div>

          {/* Reaction picker */}
          {showReactions && (
            <div className={`absolute -bottom-8 ${isOwn ? 'left-0' : 'right-0'} bg-white rounded-full shadow-lg border p-1 flex gap-1 z-10`}>
              {['👍', '❤️', '😂', '😮', '😢', '👎'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-8 h-8 hover:bg-gray-100 rounded-full transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reactions display */}
        {renderReactions()}

        {/* Reply indicator */}
        {message.replyTo && (
          <div className={`mt-1 text-xs ${
            isOwn ? 'text-primary-200' : 'text-gray-500'
          }`}>
            ↩ Replying to a message
          </div>
        )}
      </div>

      {/* Avatar for own messages (right side) */}
      {isOwn && showAvatar && (
        <div className="flex-shrink-0 ml-2 order-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0) || '?'}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;