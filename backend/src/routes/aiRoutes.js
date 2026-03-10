import express from 'express';
import { protect } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { 
  spellCheck,
  analyzeSentiment,
  smartReplies,
  summarizeConversation,
  moderateContent
} from '../controllers/aiController.js';

const router = express.Router();

// All AI routes are protected
router.use(protect);

router.post('/spell-check', aiLimiter, spellCheck);
router.post('/sentiment', aiLimiter, analyzeSentiment);
router.post('/smart-replies', aiLimiter, smartReplies);
router.post('/summarize', aiLimiter, summarizeConversation);
router.post('/moderate', aiLimiter, moderateContent);

export default router;