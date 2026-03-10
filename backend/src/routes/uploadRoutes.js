import express from 'express';
import { protect } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import upload from '../middleware/upload.js';
import { 
  uploadProfilePic,
  uploadChatImage,
  uploadChatFile,
  uploadMultiple
} from '../controllers/uploadController.js';

const router = express.Router();

// All upload routes are protected
router.use(protect);

// Profile picture upload (single file)
router.post('/profile-pic', 
  uploadLimiter, 
  upload.uploadSingle('profilePic'), 
  upload.handleMulterError,
  uploadProfilePic
);

// Chat image upload (single image)
router.post('/chat-image', 
  uploadLimiter, 
  upload.uploadSingle('chatImage'), 
  upload.handleMulterError,
  uploadChatImage
);

// Chat file upload (single file)
router.post('/chat-file', 
  uploadLimiter, 
  upload.uploadSingle('chatFile'), 
  upload.handleMulterError,
  uploadChatFile
);

// Multiple files upload (up to 5)
router.post('/multiple', 
  uploadLimiter, 
  upload.uploadMultiple('files', 5), 
  upload.handleMulterError,
  uploadMultiple
);

export default router;