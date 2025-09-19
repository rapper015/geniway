import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic Authentication
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false, // Not required for auto-registered guest users
    minlength: 6
  },
  
  // Profile Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  preferredName: {
    type: String,
    trim: true
  },
  whatsappNumber: {
    type: String,
    trim: true
  },
  
  // Academic Information
  role: {
    type: String,
    enum: ['student', 'parent', 'teacher', 'other'],
    default: 'student'
  },
  grade: {
    type: Number,
    min: 1,
    max: 12
  },
  board: {
    type: String,
    enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'],
    default: 'CBSE'
  },
  state: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  school: {
    type: String,
    trim: true
  },
  subjects: [{
    type: String,
    enum: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'Computer Science', 'Sanskrit']
  }],
  
  // Language Preferences
  langPref: {
    type: String,
    enum: ['en', 'hi', 'ta', 'bn', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur'],
    default: 'en'
  },
  teachingLanguage: {
    type: String,
    enum: ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu'],
    default: 'English'
  },
  
  // Learning Preferences
  pace: {
    type: String,
    enum: ['Fast', 'Normal', 'Detailed'],
    default: 'Normal'
  },
  learningStyle: {
    type: String,
    enum: ['Visual', 'Voice', 'Text', 'Kinesthetic'],
    default: 'Text'
  },
  learningStyles: [{
    type: String,
    enum: ['Visual', 'Voice', 'Text', 'Kinesthetic']
  }],
  contentMode: {
    type: String,
    enum: ['step-by-step', 'quick-answer'],
    default: 'step-by-step'
  },
  fastTrackEnabled: {
    type: Boolean,
    default: false
  },
  
  // Chat & History
  saveChatHistory: {
    type: Boolean,
    default: true
  },
  
  // Notifications
  studyStreaksEnabled: {
    type: Boolean,
    default: true
  },
  breakRemindersEnabled: {
    type: Boolean,
    default: true
  },
  masteryNudgesEnabled: {
    type: Boolean,
    default: true
  },
  
  // Privacy & Data
  dataSharingEnabled: {
    type: Boolean,
    default: false
  },
  
  // System Fields
  isGuest: {
    type: Boolean,
    default: false
  },
  ageBand: {
    type: String,
    enum: ['6-10', '11-14', '15-18', '18+'],
    default: '11-14'
  },
  
  // Profile Collection Tracking
  profileCompletionStep: {
    type: Number,
    default: 0,
    min: 0,
    max: 9
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  
  // Additional Contact Information
  phoneNumber: {
    type: String,
    trim: true
  },
  
  // Learning Analytics
  totalQuestionsAsked: {
    type: Number,
    default: 0
  },
  totalQuizzesCompleted: {
    type: Number,
    default: 0
  },
  averageQuizScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Session Information
  lastActiveSession: {
    type: Date,
    default: Date.now
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  
  // Legacy preferences (for backward compatibility)
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      type: Boolean,
      default: true
    }
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

// Hash password before saving (only if password exists)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to validate password
userSchema.methods.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Instance method to hash password (for manual hashing if needed)
userSchema.methods.hashPassword = async function() {
  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
};

// Transform JSON output to remove password
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
