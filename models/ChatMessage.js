import { replitDB } from '../lib/replit-db.js';

export class ChatMessage {
  constructor(data = {}) {
    this.sessionId = data.sessionId || null;
    this.userId = data.userId || null;
    this.sender = data.sender || 'user';
    this.messageType = data.messageType || 'text';
    this.content = data.content || '';
    this.imageUrl = data.imageUrl || null;
    this.tokensUsed = data.tokensUsed || 0;
    this.model = data.model || 'gpt-4o';
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Static methods for database operations
  static async create(messageData) {
    const message = new ChatMessage(messageData);
    const id = replitDB.generateId();
    const savedMessage = await replitDB.create('message', id, message);
    return new ChatMessage(savedMessage);
  }

  static async findById(id) {
    const messageData = await replitDB.findById('message', id);
    return messageData ? new ChatMessage(messageData) : null;
  }

  static async findBySessionId(sessionId) {
    const messagesData = await replitDB.find('message', { sessionId });
    return messagesData.map(messageData => new ChatMessage(messageData));
  }

  static async findByUserId(userId) {
    const messagesData = await replitDB.find('message', { userId });
    return messagesData.map(messageData => new ChatMessage(messageData));
  }

  static async findOne(query) {
    const messageData = await replitDB.findOne('message', query);
    return messageData ? new ChatMessage(messageData) : null;
  }

  static async find(query = {}) {
    const messagesData = await replitDB.find('message', query);
    return messagesData.map(messageData => new ChatMessage(messageData));
  }

  static async updateById(id, updateData) {
    const updatedData = await replitDB.update('message', id, updateData);
    return new ChatMessage(updatedData);
  }

  static async deleteById(id) {
    return await replitDB.delete('message', id);
  }

  static async count(query = {}) {
    return await replitDB.count('message', query);
  }

  // Get messages for a session with pagination
  static async getSessionMessages(sessionId, limit = 50, offset = 0) {
    const allMessages = await ChatMessage.findBySessionId(sessionId);
    
    // Sort by creation time (oldest first)
    allMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Apply pagination
    return allMessages.slice(offset, offset + limit);
  }

  // Get recent messages for a user
  static async getRecentUserMessages(userId, limit = 20) {
    const allMessages = await ChatMessage.findByUserId(userId);
    
    // Sort by creation time (newest first)
    allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return allMessages.slice(0, limit);
  }

  // Get message statistics
  static async getMessageStats(userId) {
    const messages = await ChatMessage.findByUserId(userId);
    
    const stats = {
      total: messages.length,
      text: messages.filter(m => m.messageType === 'text').length,
      voice: messages.filter(m => m.messageType === 'voice').length,
      image: messages.filter(m => m.messageType === 'image').length,
      userMessages: messages.filter(m => m.sender === 'user').length,
      aiMessages: messages.filter(m => m.sender === 'ai').length,
      totalTokens: messages.reduce((sum, m) => sum + (m.tokensUsed || 0), 0)
    };
    
    return stats;
  }

  // Instance methods
  async save() {
    if (this.id) {
      const updatedData = await replitDB.update('message', this.id, this);
      Object.assign(this, updatedData);
      return this;
    } else {
      const id = replitDB.generateId();
      const savedData = await replitDB.create('message', id, this);
      Object.assign(this, savedData);
      return this;
    }
  }

  async updateContent(newContent) {
    this.content = newContent;
    this.updatedAt = new Date().toISOString();
    await this.save();
  }

  async updateTokens(tokens) {
    this.tokensUsed = tokens;
    this.updatedAt = new Date().toISOString();
    await this.save();
  }

  // Validation
  validate() {
    const errors = [];
    
    if (!this.sessionId) {
      errors.push('Session ID is required');
    }
    
    if (!this.sender || !['user', 'ai'].includes(this.sender)) {
      errors.push('Invalid sender');
    }
    
    if (!this.messageType || !['text', 'voice', 'image'].includes(this.messageType)) {
      errors.push('Invalid message type');
    }
    
    if (!this.content || this.content.trim().length === 0) {
      errors.push('Content is required');
    }
    
    if (this.tokensUsed < 0) {
      errors.push('Tokens used cannot be negative');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper methods
  isUserMessage() {
    return this.sender === 'user';
  }

  isAIMessage() {
    return this.sender === 'ai';
  }

  isTextMessage() {
    return this.messageType === 'text';
  }

  isVoiceMessage() {
    return this.messageType === 'voice';
  }

  isImageMessage() {
    return this.messageType === 'image';
  }

  getAgeInMinutes() {
    const now = new Date();
    const created = new Date(this.createdAt);
    return Math.floor((now - created) / (1000 * 60));
  }

  toJSON() {
    return { ...this };
  }
}

// Export for backward compatibility
export { ChatMessage as default };