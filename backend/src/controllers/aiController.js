import { GoogleGenerativeAI } from '@google/generative-ai';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Spell check message
// @route   POST /api/ai/spell-check
// @access  Private
export const spellCheck = async (req, res, next) => {
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

    if (!corrected || corrected.toLowerCase().includes('error') || corrected.includes('```')) {
      return res.json({
        success: true,
        original: text,
        corrected: text,
        hasCorrections: false
      });
    }

    res.json({
      success: true,
      original: text,
      corrected,
      hasCorrections: corrected.toLowerCase() !== text.toLowerCase()
    });

  } catch (error) {
    console.error('Spell check error:', error);
    res.json({
      success: true,
      original: req.body.text,
      corrected: req.body.text,
      hasCorrections: false
    });
  }
};

// @desc    Analyze sentiment
// @route   POST /api/ai/sentiment
// @access  Private
export const analyzeSentiment = async (req, res, next) => {
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
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse sentiment JSON:', e);
    }

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
};

// @desc    Generate smart replies
// @route   POST /api/ai/smart-replies
// @access  Private
export const smartReplies = async (req, res, next) => {
  try {
    const { conversationId, count = 3 } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

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

    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      suggestions = ['👍 Okay', 'Thanks!', 'Got it'].slice(0, count);
    }

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Smart replies error:', error);
    next(error);
  }
};

// @desc    Summarize conversation
// @route   POST /api/ai/summarize
// @access  Private
export const summarizeConversation = async (req, res, next) => {
  try {
    const { conversationId, messageCount = 50 } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

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
          keyPoints: []
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
  "actionItems": ["array of any action items or decisions"]
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

    if (!summary) {
      summary = {
        summary: 'Conversation summary unavailable',
        keyPoints: ['Unable to generate key points'],
        actionItems: []
      };
    }

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Summarize error:', error);
    next(error);
  }
};

// @desc    Moderate content
// @route   POST /api/ai/moderate
// @access  Private
export const moderateContent = async (req, res, next) => {
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
};