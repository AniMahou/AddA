export const setupTypingHandlers = (io, socket, onlineUsers) => {
    // User started typing
    socket.on('typing:start', (data) => {
      const { conversationId, receiverId } = data;
      const userId = socket.handshake.auth.userId;
  
      const receiverSocket = onlineUsers.get(receiverId?.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit('typing:start', {
          userId,
          conversationId
        });
      }
    });
  
    // User stopped typing
    socket.on('typing:stop', (data) => {
      const { conversationId, receiverId } = data;
      const userId = socket.handshake.auth.userId;
  
      const receiverSocket = onlineUsers.get(receiverId?.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit('typing:stop', {
          userId,
          conversationId
        });
      }
    });
  
    // User is typing (debounced on frontend)
    socket.on('typing', (data) => {
      const { conversationId, receiverId, isTyping } = data;
      const userId = socket.handshake.auth.userId;
  
      const receiverSocket = onlineUsers.get(receiverId?.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit('userTyping', {
          userId,
          conversationId,
          isTyping
        });
      }
    });
  };