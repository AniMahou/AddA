import express from 'express';
import { protect } from '../middleware/auth.js';
import { validateFriendRequest } from '../middleware/validation.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { 
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend
} from '../controllers/friendController.js';

const router = express.Router();

// All friend routes are protected
router.use(protect);

router.get('/', getFriends);
router.get('/requests', getFriendRequests);
router.post('/request', apiLimiter, validateFriendRequest, sendFriendRequest);
router.put('/accept/:requestId', acceptFriendRequest);
router.put('/reject/:requestId', rejectFriendRequest);
router.delete('/:friendId', removeFriend);

export default router;