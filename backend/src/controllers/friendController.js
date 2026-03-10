import mongoose from 'mongoose';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Conversation from '../models/Conversation.js';

// @desc    Send friend request
// @route   POST /api/friends/request
// @access  Private
export const sendFriendRequest = async (req, res, next) => {
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

    if (receiverId === req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot send request to yourself'
      });
    }

    const receiver = await User.findById(receiverId).session(session);
    if (!receiver) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const sender = await User.findById(req.user._id).session(session);
    if (sender.friends.includes(receiverId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Already friends'
      });
    }

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
        message: 'Request already exists'
      });
    }

    const rejectedRequest = await FriendRequest.findOne({
      sender: receiverId,
      receiver: req.user._id,
      status: 'rejected',
      updatedAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).session(session);

    if (rejectedRequest) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Please wait before sending another request'
      });
    }

    const friendRequest = await FriendRequest.create([{
      sender: req.user._id,
      receiver: receiverId,
      message: message || '',
      status: 'pending'
    }], { session });

    receiver.friendRequests.push({
      from: req.user._id,
      status: 'pending'
    });
    await receiver.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Friend request sent',
      data: friendRequest[0]
    });

  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Accept friend request
// @route   PUT /api/friends/accept/:requestId
// @access  Private
export const acceptFriendRequest = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .session(session);

    if (!friendRequest) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (friendRequest.receiver._id.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (friendRequest.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Request already ${friendRequest.status}`
      });
    }

    friendRequest.status = 'accepted';
    friendRequest.respondedAt = new Date();
    await friendRequest.save({ session });

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
};

// @desc    Reject friend request
// @route   PUT /api/friends/reject/:requestId
// @access  Private
export const rejectFriendRequest = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId).session(session);

    if (!friendRequest) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (friendRequest.receiver.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
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
};

// @desc    Get all friend requests
// @route   GET /api/friends/requests
// @access  Private
export const getFriendRequests = async (req, res, next) => {
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
};

// @desc    Get all friends
// @route   GET /api/friends
// @access  Private
export const getFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'friends',
        select: 'name email profilePic bio online lastSeen'
      });

    const friendsWithLastMessage = await Promise.all(
      user.friends.map(async (friend) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [req.user._id, friend._id] },
          isGroupChat: false
        }).populate('lastMessage');

        const friendObj = friend.toObject();
        friendObj.lastMessage = conversation?.lastMessage || null;
        friendObj.conversationId = conversation?._id || null;
        friendObj.unreadCount = conversation?.unreadCount?.get(req.user._id.toString()) || 0;
        
        return friendObj;
      })
    );

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
};

// @desc    Remove friend
// @route   DELETE /api/friends/:friendId
// @access  Private
export const removeFriend = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { friendId } = req.params;

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

    await Conversation.findOneAndUpdate(
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
      message: 'Friend removed'
    });

  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};