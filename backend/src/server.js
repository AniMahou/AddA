// backend/src/server.js
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'colors';
// Load environment variables
dotenv.config();

// Import configurations
import connectDB from './config/db.js';
import { connectCloudinary } from './config/cloudinary.js';
import configureSocket from './config/socket.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

// Import routes (we'll create these next)
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Initialize express
const app = express();
const server = http.createServer(app);

// Connect to databases
connectDB();
connectCloudinary();

// Initialize Socket.io
const io = configureSocket(server);

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for uploads)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/upload', uploadRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to VibeChat API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔵 New client connected:', socket.id);
  
  // We'll add socket event handlers here later
  
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`.yellow.bold);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`.cyan);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ UNHANDLED REJECTION! Shutting down...'.red.bold);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ UNCAUGHT EXCEPTION! Shutting down...'.red.bold);
  console.log(err.name, err.message);
  process.exit(1);
});