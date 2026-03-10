// controllers/messageController.js
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

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

    const query = { conversation: conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .populate('sender', 'name email profilePic')
      .populate('readBy.user', 'name email profilePic')
      .populate('reactions.user', 'name email profilePic')
      .lean();

    const hasMore = messages.length === parseInt(limit);
    const lastMessage = messages[messages.length - 1];

    // Mark messages as read
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

      const currentUnread = conversation.unreadCount.get(req.user._id.toString()) || 0;
      conversation.unreadCount.set(req.user._id.toString(), 
        Math.max(0, currentUnread - unreadMessages.length));
      await conversation.save();
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
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { receiverId, content, messageType = 'text', fileUrl, fileName, fileSize, replyTo } = req.body;

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    const sender = await User.findById(req.user._id);
    if (!sender.friends.includes(receiverId)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'You can only message friends'
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, receiverId] },
      isGroupChat: false
    }).session(session);

    if (!conversation) {
      conversation = await Conversation.create([{
        participants: [req.user._id, receiverId],
        lastMessageTime: new Date(),
        unreadCount: new Map([
          [receiverId.toString(), 0],
          [req.user._id.toString(), 0]
        ])
      }], { session });
      conversation = conversation[0];
    }

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

    conversation.lastMessage = message._id;
    conversation.lastMessagePreview = content.substring(0, 100);
    conversation.lastMessageTime = new Date();
    
    const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
    await conversation.save({ session });

    await session.commitTransaction();

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
};

// @desc    Mark message as read
// @route   PUT /api/messages/:messageId/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark messages sent to you as read'
      });
    }

    const alreadyRead = message.readBy.some(
      r => r.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({ user: req.user._id, readAt: new Date() });
      
      const allParticipantsRead = message.readBy.length === 2;
      if (allParticipantsRead) {
        message.status = 'read';
      }
      
      await message.save();

      const conversation = await Conversation.findById(message.conversation);
      const currentUnread = conversation.unreadCount.get(req.user._id.toString()) || 0;
      if (currentUnread > 0) {
        conversation.unreadCount.set(req.user._id.toString(), currentUnread - 1);
        await conversation.save();
      }
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Add reaction to message
// @route   PUT /api/messages/:messageId/reaction
// @access  Private
export const addReaction = async (req, res, next) => {
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

    const conversation = await Conversation.findById(message.conversation);
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    const existingReactionIndex = message.reactions.findIndex(
      r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      message.reactions = message.reactions.filter(
        r => r.user.toString() !== req.user._id.toString()
      );
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
};

// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

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
};