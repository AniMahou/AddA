import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Conversation from '../models/Conversation.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   POST /api/friends/request
// @desc    Send friend request
// @access  Private
router.post('/request', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { receiverId, message } = req.body;

    if (!receiverId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required'
      });
    }

    // Check if trying to add self
    if (receiverId === req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'You cannot send friend request to yourself'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId).session(session);
    if (!receiver) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already friends
    const sender = await User.findById(req.user._id).session(session);
    if (sender.friends.includes(receiverId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'You are already friends with this user'
      });
    }

    // Check for existing pending request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: receiverId, status: 'pending' },
        { sender: receiverId, receiver: req.user._id, status: 'pending' }
      ]
    }).session(session);

    if (existingRequest) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'A friend request already exists between you'
      });
    }

    // Check for rejected request (cooldown period)
    const rejectedRequest = await FriendRequest.findOne({
      sender: receiverId,
      receiver: req.user._id,
      status: 'rejected',
      updatedAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 days cooldown
    }).session(session);

    if (rejectedRequest) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Your previous friend request was rejected. Please wait before sending another.'
      });
    }

    // Create friend request
    const friendRequest = await FriendRequest.create([{
      sender: req.user._id,
      receiver: receiverId,
      message: message || '',
      status: 'pending'
    }], { session });

    // Add to user's friendRequests array
    receiver.friendRequests.push({
      from: req.user._id,
      status: 'pending'
    });
    await receiver.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Friend request sent successfully',
      data: friendRequest[0]
    });

  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @route   PUT /api/friends/accept/:requestId
// @desc    Accept friend request
// @access  Private
router.put('/accept/:requestId', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { requestId } = req.params;

    // Find the friend request
    const friendRequest = await FriendRequest.findById(requestId)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .session(session);

    if (!friendRequest) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Check if user is the receiver
    if (friendRequest.receiver._id.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'You can only accept requests sent to you'
      });
    }

    // Check if request is still pending
    if (friendRequest.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `This request has already been ${friendRequest.status}`
      });
    }

    // Update friend request status
    friendRequest.status = 'accepted';
    friendRequest.respondedAt = new Date();
    await friendRequest.save({ session });

    // Add each other to friends lists
    await User.findByIdAndUpdate(
      friendRequest.sender._id,
      { $addToSet: { friends: friendRequest.receiver._id } },
      { session }
    );

    await User.findByIdAndUpdate(
      friendRequest.receiver._id,
      { 
        $addToSet: { friends: friendRequest.sender._id },
        $pull: { friendRequests: { from: friendRequest.sender._id } }
      },
      { session }
    );

    // Create a conversation between them
    const conversation = await Conversation.create([{
      participants: [friendRequest.sender._id, friendRequest.receiver._id],
      lastMessageTime: new Date(),
      unreadCount: new Map([
        [friendRequest.sender._id.toString(), 0],
        [friendRequest.receiver._id.toString(), 0]
      ])
    }], { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Friend request accepted',
      data: {
        friend: {
          _id: friendRequest.sender._id,
          name: friendRequest.sender.name,
          email: friendRequest.sender.email
        },
        conversationId: conversation[0]._id
      }
    });

  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @route   PUT /api/friends/reject/:requestId
// @desc    Reject friend request
// @access  Private
router.put('/reject/:requestId', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId).session(session);

    if (!friendRequest) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    if (friendRequest.receiver.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'You can only reject requests sent to you'
      });
    }

    friendRequest.status = 'rejected';
    friendRequest.respondedAt = new Date();
    await friendRequest.save({ session });

    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { friendRequests: { from: friendRequest.sender } } },
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Friend request rejected'
    });

  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// @route   GET /api/friends/requests
// @desc    Get all friend requests for current user
// @access  Private
router.get('/requests', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'friendRequests.from',
        select: 'name email profilePic bio'
      });

    const pendingRequests = user.friendRequests.filter(
      req => req.status === 'pending'
    );

    res.json({
      success: true,
      data: pendingRequests
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/friends
// @desc    Get all friends with online status
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'friends',
        select: 'name email profilePic bio online lastSeen'
      });

    // Get last message for each friend
    const friendsWithLastMessage = await Promise.all(
      user.friends.map(async (friend) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [req.user._id, friend._id] },
          isGroupChat: false
        }).populate('lastMessage');

        const friendObj = friend.toObject();
        friendObj.lastMessage = conversation?.lastMessage || null;
        friendObj.conversationId = conversation?._id || null;
        
        return friendObj;
      })
    );

    // Sort by last message time
    friendsWithLastMessage.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt || a.lastSeen || 0;
      const timeB = b.lastMessage?.createdAt || b.lastSeen || 0;
      return timeB - timeA;
    });

    res.json({
      success: true,
      data: friendsWithLastMessage
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/friends/:friendId
// @desc    Remove friend
// @access  Private
router.delete('/:friendId', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { friendId } = req.params;

    // Remove from both users' friends lists
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { friends: friendId } },
      { session }
    );

    await User.findByIdAndUpdate(
      friendId,
      { $pull: { friends: req.user._id } },
      { session }
    );

    // Optionally delete or archive conversation
    const conversation = await Conversation.findOneAndUpdate(
      {
        participants: { $all: [req.user._id, friendId] },
        isGroupChat: false
      },
      { isActive: false },
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

export default router;