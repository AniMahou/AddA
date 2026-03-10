import express from 'express';
import { protect } from '../middleware/auth.js';
import { validateProfileUpdate } from '../middleware/validation.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { 
  getProfile,
  updateProfile,
  searchUsers,
  getUserById,
  getFriendSuggestions
} from '../controllers/userController.js';

const router = express.Router();

// All user routes are protected
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validateProfileUpdate, updateProfile);
router.get('/search', apiLimiter, searchUsers);
router.get('/friends/suggestions', getFriendSuggestions);
router.get('/:userId', getUserById);

export default router;