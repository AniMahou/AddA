import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validateProfileUpdate } from '../middleware/validation.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', async (req, res, next) => {
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
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', validateProfileUpdate, async (req, res, next) => {
  try {
    const { name, bio, profilePic } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
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
});

// @route   GET /api/users/search
// @desc    Search users by name/email
// @access  Private
router.get('/search', async (req, res, next) => {
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

    // Search by name or email, excluding current user
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

    // Check friend status for each user
    const currentUser = await User.findById(req.user._id);
    const usersWithStatus = users.map(user => {
      const userObj = user.toObject();
      
      // Check if already friends
      userObj.isFriend = currentUser.friends.includes(user._id);
      
      // Check if friend request pending
      const pendingRequest = currentUser.friendRequests.find(
        req => req.from.toString() === user._id.toString() && req.status === 'pending'
      );
      userObj.hasPendingRequest = !!pendingRequest;
      
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
});

// @route   GET /api/users/:userId
// @desc    Get user by ID
// @access  Private
router.get('/:userId', async (req, res, next) => {
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

    // Check relationship with current user
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
});

// @route   GET /api/users/friends/suggestions
// @desc    Get friend suggestions
// @access  Private
router.get('/friends/suggestions', async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).populate('friends');
    
    // Get friends of friends (mutual connections)
    const friendIds = currentUser.friends.map(f => f._id);
    
    const suggestions = await User.aggregate([
      {
        $match: {
          _id: { $ne: currentUser._id, $nin: friendIds },
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'friendrequests',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$receiver', currentUser._id] },
                    { $eq: ['$sender', '$$userId'] },
                    { $eq: ['$status', 'pending'] }
                  ]
                }
              }
            }
          ],
          as: 'pendingRequest'
        }
      },
      {
        $match: { pendingRequest: { $size: 0 } }
      },
      {
        $project: {
          name: 1,
          email: 1,
          profilePic: 1,
          bio: 1,
          mutualFriends: {
            $size: {
              $setIntersection: ['$friends', friendIds]
            }
          }
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
});

export default router;