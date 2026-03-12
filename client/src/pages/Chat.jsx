import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import useChatStore from '../store/chatStore';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatContainer from '../components/chat/ChatContainer';
import { Navigate } from 'react-router-dom';

const Chat = () => {
  const { isAuthenticated, user } = useAuth();
  const { isConnected } = useSocket();
  const { 
    conversations, 
    currentConversation,
    unreadCounts,
    loadConversations,
    selectConversation 
  } = useChatStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, loadConversations]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white">
        <ChatSidebar
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={selectConversation}
          unreadCounts={unreadCounts}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1">
        <ChatContainer />
      </div>

      {/* Connection status */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-lg">
          Connecting to server...
        </div>
      )}
    </div>
  );
};

export default Chat;