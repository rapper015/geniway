import { replitDB } from '../lib/replit-db.js';

export class ChatSession {
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
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Static methods for database operations
  static async create(sessionData) {
    const session = new ChatSession(sessionData);
    const id = replitDB.generateId();
    const savedSession = await replitDB.create('session', id, session);
    return new ChatSession(savedSession);
  }

  static async findById(id) {
    const sessionData = await replitDB.findById('session', id);
    return sessionData ? new ChatSession(sessionData) : null;
  }

  static async findByUserId(userId, status = 'active') {
    const sessionsData = await replitDB.find('session', { userId, status });
    return sessionsData.map(sessionData => new ChatSession(sessionData));
  }

  static async findGuestSessions(guestId) {
    const sessionsData = await replitDB.find('session', { userId: guestId, isGuest: true });
    return sessionsData.map(sessionData => new ChatSession(sessionData));
  }

  static async findOne(query) {
    const sessionData = await replitDB.findOne('session', query);
    return sessionData ? new ChatSession(sessionData) : null;
  }

  static async find(query = {}) {
    const sessionsData = await replitDB.find('session', query);
    return sessionsData.map(sessionData => new ChatSession(sessionData));
  }

  static async updateById(id, updateData) {
    const updatedData = await replitDB.update('session', id, updateData);
    return new ChatSession(updatedData);
  }

  static async deleteById(id) {
    return await replitDB.delete('session', id);
  }

  static async count(query = {}) {
    return await replitDB.count('session', query);
  }

  // Instance methods
  async save() {
    if (this.id) {
      const updatedData = await replitDB.update('session', this.id, this);
      Object.assign(this, updatedData);
      return this;
    } else {
      const id = replitDB.generateId();
      const savedData = await replitDB.create('session', id, this);
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
export { ChatSession as default };