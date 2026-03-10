import express from 'express';
import { protect } from '../middleware/auth.js';
import { validateSignup, validateLogin } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { signup, login, logout, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', authLimiter, validateSignup, signup);
router.post('/login', authLimiter, validateLogin, login);
router.post('/logout', protect, logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;