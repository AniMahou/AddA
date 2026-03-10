import express from 'express';
import { protect } from '../middleware/auth.js';
import { validateMessage } from '../middleware/validation.js';
import { messageLimiter } from '../middleware/rateLimiter.js';
import { 
  getMessages,
  sendMessage,
  markAsRead,
  addReaction,
  deleteMessage
} from '../controllers/messageController.js';

const router = express.Router();

// All message routes are protected
router.use(protect);

router.get('/:conversationId', messageLimiter, getMessages);
router.post('/', validateMessage, messageLimiter, sendMessage);
router.put('/:messageId/read', markAsRead);
router.put('/:messageId/reaction', addReaction);
router.delete('/:messageId', deleteMessage);

export default router;