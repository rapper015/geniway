import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true
  },
  userId: {
    type: String, // Use String type to accept both ObjectId strings and guest IDs
    required: false // Allow guest messages
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'voice', 'image'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: false
  },
  tokensUsed: {
    type: Number,
    default: 0
  },
  model: {
    type: String,
    default: 'gpt-4o'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);
