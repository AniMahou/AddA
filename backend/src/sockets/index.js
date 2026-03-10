import { setupMessageHandlers } from './messageHandler.js';
import { setupTypingHandlers } from './typingHandler.js';
import { setupPresenceHandlers } from './presenceHandler.js';
import User from '../models/User.js';

// Store online users (userId -> socketId)
const onlineUsers = new Map();

export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('🔵 New client connected:', socket.id);

    // Get user ID from handshake auth
    const userId = socket.handshake.auth.userId;
    
    if (userId) {
      // Store user connection
      onlineUsers.set(userId, socket.id);
      
      // Update user status in DB
      User.findByIdAndUpdate(userId, { 
        online: true, 
        lastSeen: new Date(),
        socketId: socket.id 
      }).then(() => {
        // Notify friends
        User.findById(userId).populate('friends').then(user => {
          if (user) {
            user.friends.forEach(friend => {
              const friendSocket = onlineUsers.get(friend._id.toString());
              if (friendSocket) {
                io.to(friendSocket).emit('friendOnline', {
                  userId: userId,
                  online: true
                });
              }
            });
          }
        });
      });
    }

    // Setup all handlers
    setupMessageHandlers(io, socket, onlineUsers);
    setupTypingHandlers(io, socket, onlineUsers);
    setupPresenceHandlers(io, socket, onlineUsers);

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('🔴 Client disconnected:', socket.id);
      
      if (userId) {
        // Remove from online users
        onlineUsers.delete(userId);
        
        // Update user status in DB
        await User.findByIdAndUpdate(userId, { 
          online: false, 
          lastSeen: new Date(),
          socketId: null 
        });

        // Notify friends
        const user = await User.findById(userId).populate('friends');
        if (user) {
          user.friends.forEach(friend => {
            const friendSocket = onlineUsers.get(friend._id.toString());
            if (friendSocket) {
              io.to(friendSocket).emit('friendOffline', {
                userId: userId,
                lastSeen: new Date()
              });
            }
          });
        }
      }
    });
  });

  return io;
};

export { onlineUsers };