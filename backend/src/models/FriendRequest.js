// backend/src/models/FriendRequest.js
import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 200,
    default: ''
  },
  read: {
    type: Boolean,
    default: false
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure one request per pair
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Don't allow self friend requests
// Don't allow self friend requests
friendRequestSchema.pre('save', async function() {
    if (this.sender.toString() === this.receiver.toString()) {
      throw new Error('Cannot send friend request to yourself');
    }
  });

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

export default FriendRequest;