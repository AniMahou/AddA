// backend/src/config/socket.js
import { Server } from 'socket.io';

const configureSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Connection settings
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
  });

  console.log('Socket.io Configured'.cyan.underline);
  
  return io;
};

export default configureSocket;