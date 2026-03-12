import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import useChatStore from '../../store/chatStore';
import messageService from '../../services/messageService';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import toast from 'react-hot-toast';

const ChatContainer = ({ conversationId: propConversationId }) => {
  const { conversationId: urlConversationId } = useParams();
  const actualConversationId = propConversationId || urlConversationId;

  const { user } = useAuth();
  const { socket, sendMessage, markMessagesAsRead } = useSocket();
  
  const {
    currentConversation,
    messages,
    loading,
    hasMoreMessages,
    typingUsers,
    loadMessages,
    addMessage,
    updateMessage,
    setTyping,
    selectConversation,
    markConversationAsRead,
    getConversationMessages
  } = useChatStore();

  const [replyTo, setReplyTo] = useState(null);
  const conversationMessages = actualConversationId 
    ? getConversationMessages(actualConversationId)
    : [];

  // Load conversation details
  useEffect(() => {
    if (actualConversationId) {
      loadMessages(actualConversationId, { page: 1 });
    }
  }, [actualConversationId, loadMessages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !actualConversationId) return;

    const handleNewMessage = (message) => {
      if (message.conversation === actualConversationId) {
        addMessage(message);
        
        // Mark as read if it's from someone else and we're in this chat
        if (message.sender._id !== user?._id) {
          markMessagesAsRead([message._id], actualConversationId);
        }
      }
    };

    const handleMessageEdited = ({ messageId, newContent }) => {
      updateMessage(actualConversationId, messageId, { content: newContent });
    };

    const handleMessageDeleted = ({ messageId }) => {
      updateMessage(actualConversationId, messageId, { isDeleted: true });
    };

    const handleReactionUpdated = ({ messageId, reactions }) => {
      updateMessage(actualConversationId, messageId, { reactions });
    };

    const handleTyping = ({ userId, conversationId, isTyping }) => {
      if (conversationId === actualConversationId && userId !== user?._id) {
        setTyping(conversationId, userId, isTyping);
      }
    };

    socket.onMessageReceived(handleNewMessage);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('reactionUpdated', handleReactionUpdated);
    socket.onUserTyping(handleTyping);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('reactionUpdated', handleReactionUpdated);
      socket.off('userTyping', handleTyping);
    };
  }, [socket, actualConversationId, user, addMessage, updateMessage, setTyping, markMessagesAsRead]);

  const handleSendMessage = async (messageData) => {
    try {
      const response = await messageService.sendMessage({
        ...messageData,
        conversationId: actualConversationId
      });
      
      // Add message to store optimistically
      addMessage(response.data);
      
      // Send via socket for real-time
      sendMessage({
        ...messageData,
        conversationId: actualConversationId
      });
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await messageService.addReaction(messageId, emoji);
      socket.addReaction(messageId, emoji);
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      socket.deleteMessage({ messageId });
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleEdit = (message) => {
    // Implement edit functionality
    setReplyTo(message);
  };

  const handleLoadMore = () => {
    if (hasMoreMessages[actualConversationId] && !loading) {
      const firstMessage = conversationMessages[0];
      loadMessages(actualConversationId, {
        page: 2,
        before: firstMessage?.createdAt
      });
    }
  };

  const handleTyping = (isTyping) => {
    if (!currentConversation) return;
    
    const receiverId = currentConversation.participants?.find(
      p => p._id !== user?._id
    )?._id;

    if (receiverId) {
      socket.sendTypingStatus({
        conversationId: actualConversationId,
        receiverId,
        isTyping
      });
    }
  };

  if (!actualConversationId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-300 mb-2">Welcome to AddA</h2>
          <p className="text-gray-400">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <ChatHeader 
        conversation={currentConversation} 
        user={user}
      />
      
      <MessageList
        messages={conversationMessages}
        currentUser={user}
        onReaction={handleReaction}
        onDelete={handleDelete}
        onEdit={handleEdit}
        typingUsers={typingUsers[actualConversationId] || []}
        conversationId={actualConversationId}
        hasMore={hasMoreMessages[actualConversationId]}
        onLoadMore={handleLoadMore}
        loading={loading}
      />
      
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        conversationId={actualConversationId}
        receiverId={currentConversation?.participants?.find(
          p => p._id !== user?._id
        )?._id}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};

export default ChatContainer;