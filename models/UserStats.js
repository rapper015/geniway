import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema({
  userId: {
    type: String, // Use String type to accept both ObjectId strings and guest IDs
    required: true,
    unique: true
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  totalTextMessages: {
    type: Number,
    default: 0
  },
  totalVoiceMessages: {
    type: Number,
    default: 0
  },
  totalImageMessages: {
    type: Number,
    default: 0
  },
  totalTokensUsed: {
    type: Number,
    default: 0
  },
  totalSessions: {
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
userStatsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const UserStats = mongoose.models.UserStats || mongoose.model('UserStats', userStatsSchema);
