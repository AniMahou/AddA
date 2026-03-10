import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validateMessage } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/messages/:conversationId
// @desc    Get messages for a conversation
// @access  Private
router.get('/:conversationId', async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    // Validate conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Build query
    const query = { conversation: conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Get messages with pagination
    const messages = await Message.find(query)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .populate('sender', 'name email profilePic')
      .populate('readBy.user', 'name email profilePic')
      .populate('reactions.user', 'name email profilePic')
      .lean();

    // Check if there are more messages
    const hasMore = messages.length === parseInt(limit);
    const lastMessage = messages[messages.length - 1];

    // Mark messages as delivered if they were sent to current user
    const unreadMessages = messages.filter(
      m => m.receiver.toString() === req.user._id.toString() && 
           !m.readBy.some(r => r.user.toString() === req.user._id.toString())
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessages.map(m => m._id) } },
        { 
          $push: { 
            readBy: { 
              user: req.user._id, 
              readAt: new Date() 
            } 
          },
          status: 'read'
        }
      );
    }

    res.json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore,
        nextCursor: hasMore ? lastMessage?.createdAt : null
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', validateMessage, async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { receiverId, content, messageType = 'text', fileUrl, fileName, fileSize, replyTo } = req.body;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Check if users are friends
    const sender = await User.findById(req.user._id);
    if (!sender.friends.includes(receiverId)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'You can only message friends'
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, receiverId] },
      isGroupChat: false
    }).session(session);

    if (!conversation) {
      conversation = await Conversation.create([{
        participants: [req.user._id, receiverId],
        lastMessageTime: new Date(),
        unreadCount: new Map([[receiverId.toString(), 0], [req.user._id.toString(), 0]])
      }], { session });
      conversation = conversation[0];
    }

    // Create message
    const messageData = {
      sender: req.user._id,
      receiver: receiverId,
      conversation: conversation._id,
      content,
      messageType,
      status: 'sent'
    };

    if (fileUrl) {
      messageData.fileUrl = fileUrl;
      messageData.fileName = fileName;
      messageData.fileSize = fileSize;
    }

    if (replyTo) {
      const originalMessage = await Message.findById(replyTo);
      if (originalMessage) {
        messageData.replyTo = replyTo;
      }
    }

    const [message] = await Message.create([messageData], { session });
    await message.populate('sender', 'name email profilePic');

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessagePreview = content.substring(0, 100);
    conversation.lastMessageTime = new Date();
    
    // Increment unread count for receiver
    const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
    
    await conversation.save({ session });

    await session.commitTransaction();

    // Emit socket event (handled in socket layer)
    res.status(201).json({
      success: true,
      data: message
    });

  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/:messageId/read', async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the receiver
    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark messages sent to you as read'
      });
    }

    // Check if already read
    const alreadyRead = message.readBy.some(
      r => r.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({ user: req.user._id, readAt: new Date() });
      
      // Check if all receivers have read
      const conversation = await Conversation.findById(message.conversation);
      if (conversation.participants.every(p => 
        p.toString() === message.sender.toString() || 
        message.readBy.some(r => r.user.toString() === p.toString())
      )) {
        message.status = 'read';
      }
      
      await message.save();

      // Decrement unread count in conversation
      const conv = await Conversation.findById(message.conversation);
      const currentUnread = conv.unreadCount.get(req.user._id.toString()) || 0;
      if (currentUnread > 0) {
        conv.unreadCount.set(req.user._id.toString(), currentUnread - 1);
        await conv.save();
      }
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/messages/:messageId/reaction
// @desc    Add/remove reaction to message
// @access  Private
router.put('/:messageId/reaction', async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is participant in conversation
    const conversation = await Conversation.findById(message.conversation);
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      // Remove reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Remove any existing reaction from this user (only one reaction per user)
      message.reactions = message.reactions.filter(
        r => r.user.toString() !== req.user._id.toString()
      );
      // Add new reaction
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    res.json({
      success: true,
      data: message.reactions
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete message (soft delete)
// @access  Private
router.delete('/:messageId', async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedFor = [req.user._id];
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted'
    });

  } catch (error) {
    next(error);
  }
});

export default router;