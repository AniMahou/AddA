// backend/src/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'friend_request',
      'friend_request_accepted',
      'new_message',
      'mention',
      'reply',
      'reaction',
      'group_invite',
      'call'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  actionUrl: {
    type: String
  },
  image: {
    type: String
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for quick queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });

// Automatically set readAt when read
notificationSchema.pre('save', function(next) {
  if (this.read && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;