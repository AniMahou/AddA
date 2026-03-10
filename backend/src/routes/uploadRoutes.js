import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

const router = express.Router();

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on file type and purpose
    let folder = 'adda';
    if (file.fieldname === 'profilePic') {
      folder = 'adda/profile-pictures';
    } else if (file.fieldname === 'chatImage') {
      folder = 'adda/chat-images';
    } else if (file.fieldname === 'chatFile') {
      folder = 'adda/chat-files';
    }

    return {
      folder: folder,
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
      transformation: file.fieldname === 'profilePic' ? [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' }
      ] : undefined
    };
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (file.fieldname === 'profilePic' || file.fieldname === 'chatImage') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed for this upload'), false);
    }
  } else if (file.fieldname === 'chatFile') {
    if (allowedImageTypes.includes(file.mimetype) || allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply auth middleware to all routes
router.use(protect);

// @route   POST /api/upload/profile-pic
// @desc    Upload profile picture
// @access  Private
router.post('/profile-pic', upload.single('profilePic'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Update user's profile picture
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: req.file.path },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePic: req.file.path,
        user
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/upload/chat-image
// @desc    Upload image for chat
// @access  Private
router.post('/chat-image', upload.single('chatImage'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    res.json({
      success: true,
      data: {
        fileUrl: req.file.path,
        fileType: 'image',
        fileName: req.file.originalname,
        fileSize: req.file.size
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/upload/chat-file
// @desc    Upload file for chat
// @access  Private
router.post('/chat-file', upload.single('chatFile'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    res.json({
      success: true,
      data: {
        fileUrl: req.file.path,
        fileType: req.file.mimetype.startsWith('image/') ? 'image' : 'file',
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple files
// @access  Private
router.post('/multiple', upload.array('files', 5), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload files'
      });
    }

    const files = req.files.map(file => ({
      fileUrl: file.path,
      fileType: file.mimetype.startsWith('image/') ? 'image' : 'file',
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    }));

    res.json({
      success: true,
      data: files
    });

  } catch (error) {
    next(error);
  }
});

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field'
      });
    }
  }
  next(error);
});

export default router;