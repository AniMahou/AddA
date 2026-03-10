import { body, validationResult } from 'express-validator';

// Validation middleware
export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

// Signup validation
export const validateSignup = validate([
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number')
]);

// Login validation
export const validateLogin = validate([
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
]);

// Profile update validation
export const validateProfileUpdate = validate([
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Bio cannot exceed 200 characters'),
  
  body('profilePic')
    .optional()
    .isURL().withMessage('Profile picture must be a valid URL')
]);

// Message validation
export const validateMessage = validate([
  body('receiverId')
    .notEmpty().withMessage('Receiver ID is required')
    .isMongoId().withMessage('Invalid receiver ID'),
  
  body('content')
    .if(body('messageType').equals('text'))
    .notEmpty().withMessage('Message content is required for text messages')
    .isLength({ max: 5000 }).withMessage('Message cannot exceed 5000 characters'),
  
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file', 'audio', 'video']).withMessage('Invalid message type'),
  
  body('fileUrl')
    .if(body('messageType').not().equals('text'))
    .notEmpty().withMessage('File URL is required for non-text messages')
    .isURL().withMessage('Invalid file URL'),
  
  body('replyTo')
    .optional()
    .isMongoId().withMessage('Invalid reply message ID')
]);

// Friend request validation
export const validateFriendRequest = validate([
  body('receiverId')
    .notEmpty().withMessage('Receiver ID is required')
    .isMongoId().withMessage('Invalid receiver ID'),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Request message cannot exceed 200 characters')
]);

// Conversation ID validation
export const validateConversationId = validate([
  body('conversationId')
    .notEmpty().withMessage('Conversation ID is required')
    .isMongoId().withMessage('Invalid conversation ID')
]);

// Search query validation
export const validateSearch = validate([
  body('q')
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage('Search query must be at least 1 character')
    .isLength({ max: 50 }).withMessage('Search query cannot exceed 50 characters')
]);