import React, { useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { groupMessagesByDate } from '../../utils/helpers';
import { FiArrowDown } from 'react-icons/fi';

const MessageList = ({ 
  messages = [], 
  currentUser,
  onReaction,
  onDelete,
  onEdit,
  typingUsers = [],
  conversationId,
  hasMore,
  onLoadMore,
  loading = false
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Scroll to bottom on new messages if near bottom
  useEffect(() => {
    if (isNearBottom && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isNearBottom]);

  // Check scroll position
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;

    setIsNearBottom(nearBottom);
    setShowScrollButton(distanceFromBottom > 200);

    // Load more when scrolling near top
    if (scrollTop < 100 && hasMore && !loading) {
      onLoadMore?.();
    }
  }, [hasMore, loading, onLoadMore]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4"
      >
        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
          </div>
        )}

        {/* Messages by date */}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex justify-center my-4">
              <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {date === new Date().toLocaleDateString() ? 'Today' : date}
              </span>
            </div>

            {/* Messages */}
            {dateMessages.map((message, index) => {
              const isOwn = message.sender?._id === currentUser?._id;
              const showAvatar = index === 0 || 
                dateMessages[index - 1]?.sender?._id !== message.sender?._id;

              return (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  onReaction={onReaction}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              );
            })}
          </div>
        ))}

        {/* Typing indicators */}
        {typingUsers.map(userId => (
          <TypingIndicator key={userId} />
        ))}

        {/* Invisible element for scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-white rounded-full shadow-lg p-2 hover:bg-gray-50 transition-colors border"
        >
          <FiArrowDown className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default MessageList;