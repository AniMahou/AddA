import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

export const setupMessageHandlers = (io, socket, onlineUsers) => {
  // Send message
  socket.on('sendMessage', async (data) => {
    try {
      const { receiverId, content, messageType = 'text', fileUrl, fileName, fileSize, replyTo } = data;
      const senderId = socket.handshake.auth.userId;

      if (!senderId || !receiverId) return;

      // Find or create conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
        isGroupChat: false
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
          lastMessageTime: new Date(),
          unreadCount: new Map([
            [receiverId.toString(), 0],
            [senderId.toString(), 0]
          ])
        });
      }

      // Create message
      const messageData = {
        sender: senderId,
        receiver: receiverId,
        conversation: conversation._id,
        content,
        messageType,
        status: 'sent'
      };

      if (fileUrl) {
        messageData.fileUrl = fileUrl;
        messageData.fileName = fileName;
        messageData.fileSize = fileSize;
      }

      if (replyTo) {
        const originalMessage = await Message.findById(replyTo);
        if (originalMessage) {
          messageData.replyTo = replyTo;
        }
      }

      const message = await Message.create(messageData);
      await message.populate('sender', 'name email profilePic');

      // Update conversation
      conversation.lastMessage = message._id;
      conversation.lastMessagePreview = content.substring(0, 100);
      conversation.lastMessageTime = new Date();
      
      const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
      conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
      await conversation.save();

      // Send to receiver if online
      const receiverSocket = onlineUsers.get(receiverId.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit('receiveMessage', {
          message,
          conversationId: conversation._id
        });

        // Update message status
        message.status = 'delivered';
        await message.save();
        
        // Notify sender
        socket.emit('messageDelivered', {
          messageId: message._id,
          deliveredAt: new Date()
        });
      } else {
        socket.emit('messageSent', {
          messageId: message._id,
          status: 'sent'
        });
      }

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Edit message
  socket.on('editMessage', async (data) => {
    try {
      const { messageId, newContent } = data;
      const userId = socket.handshake.auth.userId;

      const message = await Message.findById(messageId);
      if (!message || message.sender.toString() !== userId) return;

      message.content = newContent;
      message.metadata.set('edited', true);
      message.metadata.set('editedAt', new Date());
      await message.save();

      // Notify participants
      const conversation = await Conversation.findById(message.conversation);
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== userId) {
          const participantSocket = onlineUsers.get(participantId.toString());
          if (participantSocket) {
            io.to(participantSocket).emit('messageEdited', {
              messageId,
              newContent,
              editedAt: new Date()
            });
          }
        }
      });

    } catch (error) {
      console.error('Edit message error:', error);
    }
  });

  // Delete message
  socket.on('deleteMessage', async (data) => {
    try {
      const { messageId, deleteForEveryone = false } = data;
      const userId = socket.handshake.auth.userId;

      const message = await Message.findById(messageId);
      if (!message) return;

      if (deleteForEveryone) {
        // Only sender can delete for everyone
        if (message.sender.toString() !== userId) return;
        
        message.isDeleted = true;
        await message.save();
      } else {
        // Delete for self
        message.deletedFor.push(userId);
        await message.save();
      }

      // Notify participants
      const conversation = await Conversation.findById(message.conversation);
      conversation.participants.forEach(participantId => {
        const participantSocket = onlineUsers.get(participantId.toString());
        if (participantSocket) {
          io.to(participantSocket).emit('messageDeleted', {
            messageId,
            deletedForEveryone: deleteForEveryone,
            deletedBy: userId
          });
        }
      });

    } catch (error) {
      console.error('Delete message error:', error);
    }
  });

  // Mark as read
  socket.on('markAsRead', async (data) => {
    try {
      const { messageIds, conversationId } = data;
      const userId = socket.handshake.auth.userId;

      await Message.updateMany(
        { _id: { $in: messageIds } },
        { 
          $push: { readBy: { user: userId, readAt: new Date() } },
          status: 'read'
        }
      );

      // Update conversation unread count
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.unreadCount.set(userId.toString(), 0);
        await conversation.save();
      }

      // Notify sender
      const message = await Message.findById(messageIds[0]).populate('sender');
      const senderSocket = onlineUsers.get(message.sender._id.toString());
      if (senderSocket) {
        io.to(senderSocket).emit('messagesRead', {
          messageIds,
          readBy: userId,
          readAt: new Date()
        });
      }

    } catch (error) {
      console.error('Mark as read error:', error);
    }
  });

  // Add reaction
  socket.on('addReaction', async (data) => {
    try {
      const { messageId, emoji } = data;
      const userId = socket.handshake.auth.userId;

      const message = await Message.findById(messageId);
      if (!message) return;

      const existingReaction = message.reactions.find(
        r => r.user.toString() === userId && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        message.reactions = message.reactions.filter(
          r => !(r.user.toString() === userId && r.emoji === emoji)
        );
      } else {
        // Add reaction
        message.reactions = message.reactions.filter(
          r => r.user.toString() !== userId
        );
        message.reactions.push({ user: userId, emoji });
      }

      await message.save();

      // Notify participants
      const conversation = await Conversation.findById(message.conversation);
      conversation.participants.forEach(participantId => {
        const participantSocket = onlineUsers.get(participantId.toString());
        if (participantSocket) {
          io.to(participantSocket).emit('reactionUpdated', {
            messageId,
            reactions: message.reactions
          });
        }
      });

    } catch (error) {
      console.error('Reaction error:', error);
    }
  });
};