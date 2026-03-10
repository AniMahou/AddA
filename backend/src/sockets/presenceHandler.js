import User from '../models/User.js';

export const setupPresenceHandlers = (io, socket, onlineUsers) => {
  // User came online
  socket.on('user:online', async (data) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) return;

    onlineUsers.set(userId.toString(), socket.id);

    await User.findByIdAndUpdate(userId, {
      online: true,
      lastSeen: new Date(),
      socketId: socket.id
    });

    // Notify friends
    const user = await User.findById(userId).populate('friends');
    if (user) {
      user.friends.forEach(friend => {
        const friendSocket = onlineUsers.get(friend._id.toString());
        if (friendSocket) {
          io.to(friendSocket).emit('friend:online', {
            userId: userId.toString(),
            online: true
          });
        }
      });
    }
  });

  // User went offline
  socket.on('user:offline', async () => {
    const userId = socket.handshake.auth.userId;
    if (!userId) return;

    onlineUsers.delete(userId.toString());

    await User.findByIdAndUpdate(userId, {
      online: false,
      lastSeen: new Date()
    });

    // Notify friends
    const user = await User.findById(userId).populate('friends');
    if (user) {
      user.friends.forEach(friend => {
        const friendSocket = onlineUsers.get(friend._id.toString());
        if (friendSocket) {
          io.to(friendSocket).emit('friend:offline', {
            userId: userId.toString(),
            lastSeen: new Date()
          });
        }
      });
    }
  });

  // Get online status of a user
  socket.on('user:status', async (data) => {
    const { userId } = data;
    const requesterId = socket.handshake.auth.userId;

    if (!userId || !requesterId) return;

    const isOnline = onlineUsers.has(userId.toString());
    let lastSeen = null;

    if (!isOnline) {
      const user = await User.findById(userId).select('lastSeen');
      lastSeen = user?.lastSeen;
    }

    socket.emit('user:status:response', {
      userId,
      online: isOnline,
      lastSeen
    });
  });

  // Get all online friends
  socket.on('friends:online', async () => {
    const userId = socket.handshake.auth.userId;
    if (!userId) return;

    const user = await User.findById(userId).populate('friends');
    if (!user) return;

    const onlineFriends = user.friends.filter(friend => 
      onlineUsers.has(friend._id.toString())
    ).map(friend => friend._id.toString());

    socket.emit('friends:online:response', {
      onlineFriends
    });
  });
};