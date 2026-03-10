import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../uploads/temp'),
    path.join(__dirname, '../../uploads/profile-pictures'),
    path.join(__dirname, '../../uploads/chat-files'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../../uploads/temp');
    
    // Different paths for different file types
    if (file.fieldname === 'profilePic') {
      uploadPath = path.join(__dirname, '../../uploads/profile-pictures');
    } else if (file.fieldname === 'chatFile' || file.fieldname === 'chatImage') {
      uploadPath = path.join(__dirname, '../../uploads/chat-files');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedImages = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocuments = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/rtf'
  ];
  const allowedArchives = ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'];
  const allowedAudio = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
  const allowedVideo = ['video/mp4', 'video/webm', 'video/ogg'];

  // Combine all allowed types
  const allowedTypes = [...allowedImages, ...allowedDocuments, ...allowedArchives, ...allowedAudio, ...allowedVideo];

  if (file.fieldname === 'profilePic') {
    // Profile pictures only allow images
    if (allowedImages.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'), false);
    }
  } else if (file.fieldname === 'chatImage') {
    // Chat images only allow images
    if (allowedImages.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for chat images'), false);
    }
  } else if (file.fieldname === 'chatFile' || file.fieldname === 'files') {
    // Chat files allow all types but with size limits per type
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

// Size limits per file type
const getSizeLimit = (file) => {
  if (file.fieldname === 'profilePic') return 2 * 1024 * 1024; // 2MB
  if (file.fieldname === 'chatImage') return 5 * 1024 * 1024; // 5MB
  if (file.mimetype.startsWith('video/')) return 50 * 1024 * 1024; // 50MB for video
  if (file.mimetype.startsWith('audio/')) return 10 * 1024 * 1024; // 10MB for audio
  return 10 * 1024 * 1024; // 10MB default
};

// Dynamic limits function
const limits = (req, file) => {
  return {
    fileSize: getSizeLimit(file)
  };
};

// Create multer instance for single file upload
export const uploadSingle = (fieldName) => {
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // Default 10MB
    }
  }).single(fieldName);
};

// Create multer instance for multiple file upload
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: maxCount
    }
  }).array(fieldName, maxCount);
};

// Create multer instance for mixed fields
export const uploadFields = (fields) => {
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024
    }
  }).fields(fields);
};

// Custom error handler for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size varies by file type (2MB-50MB)'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name'
        });
      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Form has too many parts'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
    }
  }
  
  if (err.message.includes('file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// Clean up temp files
export const cleanupTempFiles = async (files) => {
  if (!files) return;
  
  const filesArray = Array.isArray(files) ? files : [files];
  
  for (const file of filesArray) {
    if (file && file.path && file.path.includes('/temp/')) {
      try {
        await fs.promises.unlink(file.path);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
    }
  }
};

// Export configured multer instance
export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleMulterError,
  cleanupTempFiles
};