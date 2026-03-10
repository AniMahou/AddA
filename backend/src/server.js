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

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { setupSocket } from './sockets/index.js';

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

// Setup socket handlers (this replaces the separate io.on('connection') below)
setupSocket(io);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for uploads)
app.use('/uploads', express.static('uploads'));

// ✅ 1. RATE LIMITING - Applied to all /api routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api', limiter);

// ✅ 2. ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

// ✅ 3. BASE ROUTE
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to AddA API',
    version: '1.0.0',
    status: 'running'
  });
});

// ✅ 4. DEBUG ROUTES (Optional - remove in production)
console.log('🔍 DEBUG: Checking registered routes...');
if (authRoutes && authRoutes.stack) {
  console.log(`✅ Auth routes found: ${authRoutes.stack.length} routes`);
  authRoutes.stack.forEach((layer) => {
    if (layer.route) {
      console.log(`  → ${Object.keys(layer.route.methods).join(',')} /api/auth${layer.route.path}`);
    }
  });
}

setTimeout(() => {
  console.log('\n🔍 All registered routes:');
  if (app._router && app._router.stack) {
    app._router.stack.forEach((layer) => {
      if (layer.route) {
        console.log(`  → ${Object.keys(layer.route.methods).join(',')} ${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        const routerPath = layer.regexp.toString();
        console.log(`  → Router: ${routerPath}`);
      }
    });
  }
}, 1000);

// ✅ 5. 404 HANDLER
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// ✅ 6. ERROR HANDLER
app.use(errorHandler);

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