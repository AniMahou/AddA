import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -friendRequests')
      .populate('friends', 'name email profilePic online lastSeen');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, profilePic } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profilePic) user.profilePic = profilePic;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const query = {
      $and: [
        { _id: { $ne: req.user._id } },
        { isActive: true },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    };

    const users = await User.find(query)
      .select('name email profilePic online lastSeen bio')
      .skip(skip)
      .limit(limit)
      .sort('name');

    const total = await User.countDocuments(query);
    const currentUser = await User.findById(req.user._id);

    const usersWithStatus = users.map(user => {
      const userObj = user.toObject();
      userObj.isFriend = currentUser.friends.includes(user._id);
      userObj.hasPendingRequest = currentUser.friendRequests.some(
        req => req.from.toString() === user._id.toString() && req.status === 'pending'
      );
      return userObj;
    });

    res.json({
      success: true,
      data: usersWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:userId
// @access  Private
export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('name email profilePic bio online lastSeen');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(req.user._id);
    const userResponse = user.toObject();
    userResponse.isFriend = currentUser.friends.includes(userId);
    userResponse.hasPendingRequest = currentUser.friendRequests.some(
      req => req.from.toString() === userId && req.status === 'pending'
    );

    res.json({
      success: true,
      data: userResponse
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get friend suggestions
// @route   GET /api/users/friends/suggestions
// @access  Private
export const getFriendSuggestions = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const friendIds = currentUser.friends.map(f => f.toString());

    const suggestions = await User.aggregate([
      {
        $match: {
          _id: { $ne: currentUser._id, $nin: friendIds },
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'friends',
          foreignField: '_id',
          as: 'friendDetails'
        }
      },
      {
        $addFields: {
          mutualFriends: {
            $size: {
              $setIntersection: ['$friendDetails._id', friendIds]
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          profilePic: 1,
          bio: 1,
          mutualFriends: 1
        }
      },
      { $sort: { mutualFriends: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    next(error);
  }
};