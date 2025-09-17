import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow guest sessions
  },
  subject: {
    type: String,
    required: true,
    default: 'general'
  },
  mode: {
    type: String,
    enum: ['step-by-step', 'quick-answer'],
    default: 'step-by-step'
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messageCount: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
chatSessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema);
