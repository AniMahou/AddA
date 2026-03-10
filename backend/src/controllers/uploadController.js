import { v2 as cloudinary } from 'cloudinary';
import User from '../models/User.js';
import fs from 'fs';

// @desc    Upload profile picture
// @route   POST /api/upload/profile-pic
// @access  Private
export const uploadProfilePic = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'adda/profile-pictures',
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto'
    });

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: result.secure_url },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile picture updated',
      data: {
        profilePic: result.secure_url,
        user
      }
    });

  } catch (error) {
    // Clean up temp file on error
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(error);
  }
};

// @desc    Upload chat image
// @route   POST /api/upload/chat-image
// @access  Private
export const uploadChatImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'adda/chat-images',
      quality: 'auto'
    });

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        fileUrl: result.secure_url,
        fileType: 'image',
        fileName: req.file.originalname,
        fileSize: req.file.size,
        publicId: result.public_id
      }
    });

  } catch (error) {
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(error);
  }
};

// @desc    Upload chat file
// @route   POST /api/upload/chat-file
// @access  Private
export const uploadChatFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'adda/chat-files',
      resource_type: 'auto'
    });

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        fileUrl: result.secure_url,
        fileType: req.file.mimetype.startsWith('image/') ? 'image' : 'file',
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        publicId: result.public_id
      }
    });

  } catch (error) {
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(error);
  }
};

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private
export const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'adda/chat-files',
        resource_type: 'auto'
      });
      
      fs.unlinkSync(file.path);
      
      return {
        fileUrl: result.secure_url,
        fileType: file.mimetype.startsWith('image/') ? 'image' : 'file',
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        publicId: result.public_id
      };
    });

    const files = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: files
    });

  } catch (error) {
    // Clean up all temp files
    if (req.files) {
      req.files.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (e) {}
      });
    }
    next(error);
  }
};