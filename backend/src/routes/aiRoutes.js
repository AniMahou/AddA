import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect } from '../middleware/auth.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.use(protect);

// @route   POST /api/ai/spell-check
// @desc    Check and correct spelling
// @access  Private
router.post('/spell-check', rateLimiter, async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Text too long. Maximum 1000 characters'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a spell checker. Correct any spelling and grammar errors in the following text. Return ONLY the corrected text, no explanations, no additional text. If the text is already correct, return it unchanged.

Text to check: "${text}"

Corrected text:`;

    const result = await model.generateContent(prompt);
    const corrected = result.response.text().trim();

    // Check if AI returned empty or error
    if (!corrected || corrected.toLowerCase().includes('error') || corrected.includes('```')) {
      return res.json({
        success: true,
        original: text,
        corrected: text,
        hasCorrections: false,
        message: 'Unable to check spelling at this time'
      });
    }

    const hasCorrections = corrected.toLowerCase() !== text.toLowerCase();

    res.json({
      success: true,
      original: text,
      corrected,
      hasCorrections,
      corrections: hasCorrections ? generateDiff(text, corrected) : []
    });

  } catch (error) {
    console.error('Spell check error:', error);
    // Fallback - return original text
    res.json({
      success: true,
      original: req.body.text,
      corrected: req.body.text,
      hasCorrections: false,
      message: 'Spell check service unavailable'
    });
  }
});

// Helper function to generate diff (simplified)
const generateDiff = (original, corrected) => {
  const originalWords = original.split(' ');
  const correctedWords = corrected.split(' ');
  const corrections = [];

  for (let i = 0; i < Math.min(originalWords.length, correctedWords.length); i++) {
    if (originalWords[i] !== correctedWords[i]) {
      corrections.push({
        original: originalWords[i],
        corrected: correctedWords[i],
        position: i
      });
    }
  }

  return corrections;
};

// @route   POST /api/ai/sentiment
// @desc    Analyze sentiment of a message
// @access  Private
router.post('/sentiment', rateLimiter, async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze the sentiment of the following message. Return a JSON object with these exact fields:
{
  "tone": "one of [very happy, happy, neutral, sad, angry, anxious, excited, confused]",
  "score": "number from -1 (very negative) to 1 (very positive)",
  "confidence": "number from 0 to 1",
  "reasons": ["array of 1-2 short reasons for this sentiment"],
  "emojis": ["array of 1-2 relevant emojis"],
  "urgency": "one of [low, medium, high]"
}

Message: "${text}"

Return ONLY the JSON object, no other text.`;

    const result = await model.generateContent(prompt);
    let analysis;

    try {
      // Extract JSON from response
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse sentiment JSON:', e);
    }

    // Fallback analysis if AI fails
    if (!analysis) {
      analysis = {
        tone: 'neutral',
        score: 0,
        confidence: 0.5,
        reasons: ['Unable to analyze deeply'],
        emojis: ['😐'],
        urgency: 'low'
      };
    }

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    next(error);
  }
});

// @route   POST /api/ai/smart-replies
// @desc    Generate smart reply suggestions
// @access  Private
router.post('/smart-replies', rateLimiter, async (req, res, next) => {
  try {
    const { conversationId, count = 3 } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    // Get last 10 messages from conversation
    const messages = await Message.find({ conversation: conversationId })
      .sort('-createdAt')
      .limit(10)
      .populate('sender', 'name')
      .lean();

    if (messages.length === 0) {
      return res.json({
        success: true,
        data: ['Hello!', 'Hi there!', 'How are you?']
      });
    }

    const conversationHistory = messages.reverse().map(m => 
      `${m.sender.name}: ${m.content}`
    ).join('\n');

    const lastMessage = messages[messages.length - 1];

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Based on this conversation, suggest ${count} short, natural, contextually appropriate replies for the last message.

Conversation:
${conversationHistory}

Last message: "${lastMessage.content}"

Return ONLY a JSON array of ${count} strings, no other text. Example: ["Sure!", "That sounds good", "Let me think about it"]`;

    const result = await model.generateContent(prompt);
    let suggestions;

    try {
      const responseText = result.response.text();
      const arrayMatch = responseText.match(/\[[\s\S]*\]/);
      suggestions = arrayMatch ? JSON.parse(arrayMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse smart replies JSON:', e);
    }

    // Fallback suggestions
    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      suggestions = [
        '👍 Okay',
        'Thanks!',
        'Got it',
        'Sure thing',
        'Let me check'
      ].slice(0, count);
    }

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Smart replies error:', error);
    next(error);
  }
});

// @route   POST /api/ai/summarize
// @desc    Summarize a conversation
// @access  Private
router.post('/summarize', rateLimiter, async (req, res, next) => {
  try {
    const { conversationId, messageCount = 50 } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    // Check if user is in conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get messages
    const messages = await Message.find({ conversation: conversationId })
      .sort('-createdAt')
      .limit(messageCount)
      .populate('sender', 'name')
      .lean();

    if (messages.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: 'No messages to summarize',
          keyPoints: [],
          participantActivity: {}
        }
      });
    }

    const conversationText = messages.reverse().map(m => 
      `${m.sender.name}: ${m.content}`
    ).join('\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Summarize this conversation. Return a JSON object with:
{
  "summary": "2-3 sentence overall summary",
  "keyPoints": ["array of 3-5 key discussion points"],
  "actionItems": ["array of any action items or decisions"],
  "participantActivity": {
    "participantName": "number of messages"
  }
}

Conversation:
${conversationText}

Return ONLY the JSON object.`;

    const result = await model.generateContent(prompt);
    let summary;

    try {
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      summary = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse summary JSON:', e);
    }

    // Calculate actual participant activity
    const participantActivity = {};
    messages.forEach(m => {
      participantActivity[m.sender.name] = (participantActivity[m.sender.name] || 0) + 1;
    });

    if (!summary) {
      summary = {
        summary: 'Conversation summary unavailable',
        keyPoints: ['Unable to generate key points'],
        actionItems: [],
        participantActivity
      };
    } else {
      summary.participantActivity = participantActivity;
    }

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Summarize error:', error);
    next(error);
  }
});

// @route   POST /api/ai/moderate
// @desc    Check message for inappropriate content
// @access  Private
router.post('/moderate', rateLimiter, async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Check if the following message contains any inappropriate content (hate speech, harassment, explicit content, violence, spam). Return a JSON object with:
{
  "isAppropriate": "boolean",
  "categories": ["array of any flagged categories - empty if none"],
  "confidence": "number 0-1",
  "reason": "short explanation if flagged"
}

Message: "${text}"

Return ONLY the JSON object.`;

    const result = await model.generateContent(prompt);
    let moderation;

    try {
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      moderation = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse moderation JSON:', e);
    }

    if (!moderation) {
      moderation = {
        isAppropriate: true,
        categories: [],
        confidence: 0.5,
        reason: 'Unable to moderate at this time'
      };
    }

    res.json({
      success: true,
      data: moderation
    });

  } catch (error) {
    console.error('Moderation error:', error);
    next(error);
  }
});

export default router;