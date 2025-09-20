import { replitDB } from '../lib/replit-db.js';

export class ChatSessionNew {
  constructor(data = {}) {
    this.userId = data.userId || null;
    this.subject = data.subject || 'general';
    this.mode = data.mode || 'step-by-step';
    this.title = data.title || 'New Chat';
    this.messageCount = data.messageCount || 0;
    this.lastActive = data.lastActive || new Date().toISOString();
    this.isGuest = data.isGuest || false;
    this.status = data.status || 'active';
    this.messages = data.messages || [];
    this.metadata = data.metadata || {
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    
    // Additional fields for new session format
    this.context = data.context || {};
    this.settings = data.settings || {
      language: 'en',
      difficulty: 'normal',
      showSteps: true
    };
    this.tags = data.tags || [];
    this.rating = data.rating || null;
    this.feedback = data.feedback || null;
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Static methods for database operations
  static async create(sessionData) {
    const session = new ChatSessionNew(sessionData);
    const id = replitDB.generateId();
    const savedSession = await replitDB.create('session_new', id, session);
    return new ChatSessionNew(savedSession);
  }

  static async findById(id) {
    const sessionData = await replitDB.findById('session_new', id);
    return sessionData ? new ChatSessionNew(sessionData) : null;
  }

  static async findByUserId(userId, status = 'active') {
    const sessionsData = await replitDB.find('session_new', { userId, status });
    return sessionsData.map(sessionData => new ChatSessionNew(sessionData));
  }

  static async findGuestSessions(guestId) {
    const sessionsData = await replitDB.find('session_new', { userId: guestId, isGuest: true });
    return sessionsData.map(sessionData => new ChatSessionNew(sessionData));
  }

  static async findOne(query) {
    const sessionData = await replitDB.findOne('session_new', query);
    return sessionData ? new ChatSessionNew(sessionData) : null;
  }

  static async find(query = {}) {
    const sessionsData = await replitDB.find('session_new', query);
    return sessionsData.map(sessionData => new ChatSessionNew(sessionData));
  }

  static async updateById(id, updateData) {
    const updatedData = await replitDB.update('session_new', id, updateData);
    return new ChatSessionNew(updatedData);
  }

  static async deleteById(id) {
    return await replitDB.delete('session_new', id);
  }

  static async count(query = {}) {
    return await replitDB.count('session_new', query);
  }

  // Get sessions by subject
  static async findBySubject(subject) {
    const sessionsData = await replitDB.find('session_new', { subject });
    return sessionsData.map(sessionData => new ChatSessionNew(sessionData));
  }

  // Get sessions by tags
  static async findByTag(tag) {
    const allSessions = await replitDB.list('session_new');
    const sessionsWithTag = allSessions.filter(session => 
      session.tags && session.tags.includes(tag)
    );
    return sessionsWithTag.map(sessionData => new ChatSessionNew(sessionData));
  }

  // Get rated sessions
  static async findRatedSessions(minRating = 1) {
    const allSessions = await replitDB.list('session_new');
    const ratedSessions = allSessions.filter(session => 
      session.rating && session.rating >= minRating
    );
    return ratedSessions.map(sessionData => new ChatSessionNew(sessionData));
  }

  // Instance methods
  async save() {
    if (this.id) {
      const updatedData = await replitDB.update('session_new', this.id, this);
      Object.assign(this, updatedData);
      return this;
    } else {
      const id = replitDB.generateId();
      const savedData = await replitDB.create('session_new', id, this);
      Object.assign(this, savedData);
      return this;
    }
  }

  async addMessage(messageId) {
    if (!this.messages.includes(messageId)) {
      this.messages.push(messageId);
      this.messageCount = this.messages.length;
      this.lastActive = new Date().toISOString();
      this.metadata.lastActivity = this.lastActive;
      await this.save();
    }
  }

  async removeMessage(messageId) {
    this.messages = this.messages.filter(id => id !== messageId);
    this.messageCount = this.messages.length;
    this.lastActive = new Date().toISOString();
    this.metadata.lastActivity = this.lastActive;
    await this.save();
  }

  async updateActivity() {
    this.lastActive = new Date().toISOString();
    this.metadata.lastActivity = this.lastActive;
    await this.save();
  }

  async updateContext(newContext) {
    this.context = { ...this.context, ...newContext };
    await this.save();
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.save();
  }

  async addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      await this.save();
    }
  }

  async removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    await this.save();
  }

  async setRating(rating) {
    this.rating = rating;
    await this.save();
  }

  async setFeedback(feedback) {
    this.feedback = feedback;
    await this.save();
  }

  async archive() {
    this.status = 'archived';
    await this.save();
  }

  async delete() {
    this.status = 'deleted';
    await this.save();
  }

  async restore() {
    this.status = 'active';
    await this.save();
  }

  // Get messages for this session
  async getMessages() {
    if (this.messages.length === 0) return [];
    
    const messages = [];
    for (const messageId of this.messages) {
      const message = await replitDB.findById('message', messageId);
      if (message) {
        messages.push(message);
      }
    }
    
    // Sort by creation time
    return messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  // Get session analytics
  async getAnalytics() {
    const messages = await this.getMessages();
    
    return {
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.sender === 'user').length,
      aiMessages: messages.filter(m => m.sender === 'ai').length,
      textMessages: messages.filter(m => m.messageType === 'text').length,
      voiceMessages: messages.filter(m => m.messageType === 'voice').length,
      imageMessages: messages.filter(m => m.messageType === 'image').length,
      totalTokens: messages.reduce((sum, m) => sum + (m.tokensUsed || 0), 0),
      averageTokensPerMessage: messages.length > 0 ? 
        messages.reduce((sum, m) => sum + (m.tokensUsed || 0), 0) / messages.length : 0,
      duration: this.getDuration(),
      rating: this.rating,
      hasFeedback: !!this.feedback
    };
  }

  getDuration() {
    const start = new Date(this.createdAt);
    const end = new Date(this.lastActive);
    return Math.floor((end - start) / (1000 * 60)); // Duration in minutes
  }

  // Validation
  validate() {
    const errors = [];
    
    if (!this.subject) {
      errors.push('Subject is required');
    }
    
    if (!['step-by-step', 'quick-answer'].includes(this.mode)) {
      errors.push('Invalid mode');
    }
    
    if (!['active', 'archived', 'deleted'].includes(this.status)) {
      errors.push('Invalid status');
    }
    
    if (this.rating && (this.rating < 1 || this.rating > 5)) {
      errors.push('Rating must be between 1 and 5');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return { ...this };
  }
}

// Export for backward compatibility
export { ChatSessionNew as default };