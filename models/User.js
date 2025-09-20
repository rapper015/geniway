import bcrypt from 'bcryptjs';
import { replitDB } from '../lib/replit-db.js';

export class User {
  constructor(data = {}) {
    // Basic Authentication
    this.email = data.email || '';
    this.password = data.password || '';
    
    // Profile Information
    this.name = data.name || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.preferredName = data.preferredName || '';
    this.whatsappNumber = data.whatsappNumber || '';
    
    // Academic Information
    this.role = data.role || 'student';
    this.grade = data.grade || null;
    this.board = data.board || 'CBSE';
    this.state = data.state || '';
    this.city = data.city || '';
    this.school = data.school || '';
    this.subjects = data.subjects || [];
    
    // Language Preferences
    this.langPref = data.langPref || 'en';
    this.teachingLanguage = data.teachingLanguage || 'English';
    
    // Learning Preferences
    this.pace = data.pace || 'Normal';
    this.learningStyle = data.learningStyle || 'Text';
    this.learningStyles = data.learningStyles || [];
    this.contentMode = data.contentMode || 'step-by-step';
    this.fastTrackEnabled = data.fastTrackEnabled || false;
    
    // Chat & History
    this.saveChatHistory = data.saveChatHistory !== false;
    
    // Notifications
    this.studyStreaksEnabled = data.studyStreaksEnabled !== false;
    this.breakRemindersEnabled = data.breakRemindersEnabled !== false;
    this.masteryNudgesEnabled = data.masteryNudgesEnabled !== false;
    
    // Privacy & Data
    this.dataSharingEnabled = data.dataSharingEnabled || false;
    
    // System Fields
    this.isGuest = data.isGuest || false;
    this.ageBand = data.ageBand || '11-14';
    
    // Profile Collection Tracking
    this.profileCompletionStep = data.profileCompletionStep || 0;
    this.profileCompleted = data.profileCompleted || false;
    
    // Additional Contact Information
    this.phoneNumber = data.phoneNumber || '';
    
    // Learning Analytics
    this.totalQuestionsAsked = data.totalQuestionsAsked || 0;
    this.totalQuizzesCompleted = data.totalQuizzesCompleted || 0;
    this.averageQuizScore = data.averageQuizScore || 0;
    
    // Session Information
    this.lastActiveSession = data.lastActiveSession || new Date().toISOString();
    this.totalSessions = data.totalSessions || 0;
    
    // Legacy preferences (for backward compatibility)
    this.preferences = data.preferences || {
      language: 'en',
      notifications: true
    };
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Static methods for database operations
  static async create(userData) {
    const user = new User(userData);
    
    // Hash password if provided
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 12);
    }
    
    // Generate unique ID
    const id = replitDB.generateId();
    
    // Save to database
    const savedUser = await replitDB.create('user', id, user);
    return new User(savedUser);
  }

  static async findById(id) {
    const userData = await replitDB.findById('user', id);
    return userData ? new User(userData) : null;
  }

  static async findByEmail(email) {
    const userData = await replitDB.findOne('user', { email: email.toLowerCase() });
    return userData ? new User(userData) : null;
  }

  static async findOne(query) {
    const userData = await replitDB.findOne('user', query);
    return userData ? new User(userData) : null;
  }

  static async find(query = {}) {
    const usersData = await replitDB.find('user', query);
    return usersData.map(userData => new User(userData));
  }

  static async updateById(id, updateData) {
    const updatedData = await replitDB.update('user', id, updateData);
    return new User(updatedData);
  }

  static async deleteById(id) {
    return await replitDB.delete('user', id);
  }

  static async count(query = {}) {
    return await replitDB.count('user', query);
  }

  // Instance methods
  async save() {
    if (this.id) {
      // Update existing user
      const updatedData = await replitDB.update('user', this.id, this);
      Object.assign(this, updatedData);
      return this;
    } else {
      // Create new user
      const id = replitDB.generateId();
      const savedData = await replitDB.create('user', id, this);
      Object.assign(this, savedData);
      return this;
    }
  }

  async validatePassword(password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
  }

  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  toJSON() {
    const userObject = { ...this };
    delete userObject.password;
    return userObject;
  }

  // Validation methods
  validate() {
    const errors = [];
    
    if (!this.email) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(this.email)) {
      errors.push('Invalid email format');
    }
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Name is required');
    }
    
    if (this.password && this.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (this.role && !['student', 'parent', 'teacher', 'other'].includes(this.role)) {
      errors.push('Invalid role');
    }
    
    if (this.grade && (this.grade < 1 || this.grade > 12)) {
      errors.push('Grade must be between 1 and 12');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export for backward compatibility
export { User as default };