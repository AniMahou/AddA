// backend/src/models/Conversation.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessagePreview: {
    type: String,
    maxlength: 100
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  groupIcon: {
    type: String,
    default: null
  },
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  mutedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  archivedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique conversations for 2 participants
conversationSchema.index({ participants: 1 }, { unique: true });

// Virtual for participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Method to get conversation name for display
conversationSchema.methods.getDisplayName = function(currentUserId) {
  if (this.isGroupChat && this.groupName) {
    return this.groupName;
  }
  
  // For 1-on-1 chat, return other participant's name
  const otherParticipant = this.participants.find(
    p => p._id.toString() !== currentUserId.toString()
  );
  return otherParticipant ? otherParticipant.name : 'Unknown';
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;