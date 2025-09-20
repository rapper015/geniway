import ChatSessionNew from '../../../models/ChatSessionNew';
import { ChatMessage } from '../../../models/ChatMessage';
import { UserStats } from '../../../models/UserStats';
import { User } from '../../../models/User';

export class DatabaseStateManager {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    this.writeQueue = [];
    this.isProcessingQueue = false;

    // Process write queue every 2 seconds
    setInterval(() => this.processWriteQueue(), 2000);
  }

  async getCurrentState(sessionId) {
    // Check cache first
    const cached = this.getFromCache(sessionId);
    if (cached) {
      return cached;
    }

    try {
      // Fetch session and messages from database
      const session = await ChatSessionNew.findById(sessionId);
      if (!session) {
        return null;
      }

      const messages = await ChatMessage.getSessionMessages(sessionId, 100, 0);

      // Fetch user profile
      const user = await User.findById(session.userId);
      const userProfile = user ? this.mapUserToProfile(user) : undefined;

      // Build tutoring context
      const context = {
        sessionId,
        userId: session.userId,
        subject: session.subject,
        language: 'en', // Default, could be from user preferences
        currentSection: undefined, // Will be determined from messages
        previousSections: [], // Will be populated from messages
        userProfile,
        messages: messages.map(msg => this.mapMessageToContext(msg)),
        createdAt: session.createdAt,
        lastActivity: session.lastActive
      };

      // Cache the context
      this.setCache(sessionId, context);
      
      return context;
    } catch (error) {
      console.error('Error getting current state:', error);
      return null;
    }
  }

  async createSession(userId, subject = 'general') {
    try {
      const session = await ChatSessionNew.create({
        userId,
        subject,
        title: `Chat - ${new Date().toLocaleDateString()}`,
        messageCount: 0,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      });
      
      // Initialize user stats if not exists
      await this.ensureUserStats(userId);
      
      return session.id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async updateState(sessionId, updates) {
    try {
      // Update session
      await ChatSessionNew.updateById(sessionId, {
        lastActive: new Date().toISOString(),
        ...updates
      });

      // Invalidate cache
      this.invalidateCache(sessionId);
      
      return true;
    } catch (error) {
      console.error('Error updating state:', error);
      return false;
    }
  }

  async getMessages(sessionId, limit = 50) {
    try {
      const messages = await ChatMessage.getSessionMessages(sessionId, limit, 0);

      return messages.map(msg => this.mapMessageToContext(msg));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async addMessage(messageData) {
    try {
      const message = await ChatMessage.create({
        sessionId: messageData.sessionId,
        userId: messageData.userId,
        sender: messageData.sender,
        messageType: messageData.messageType,
        content: messageData.content,
        imageUrl: messageData.imageUrl,
        createdAt: new Date().toISOString()
      });

      // Update session message count
      const session = await ChatSessionNew.findById(messageData.sessionId);
      if (session) {
        await session.addMessage(message.id);
      }

      // Update user stats
      await this.updateMessageStats(messageData.userId, messageData.messageType);

      // Invalidate cache
      this.invalidateCache(messageData.sessionId);

      return {
        id: message.id,
        sessionId: messageData.sessionId,
        userId: messageData.userId,
        sender: messageData.sender,
        type: messageData.messageType,
        content: messageData.content,
        imageUrl: messageData.imageUrl,
        timestamp: message.createdAt
      };
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  async expireSession(sessionId) {
    try {
      // Update session status
      const session = await ChatSessionNew.findById(sessionId);
      if (session) {
        await session.archive();
      }

      // Clear cache
      this.invalidateCache(sessionId);
      
      return true;
    } catch (error) {
      console.error('Error expiring session:', error);
      return false;
    }
  }

  // Cache management methods
  getFromCache(sessionId) {
    const cached = this.cache.get(sessionId);
    const ttl = this.cacheTTL.get(sessionId);
    
    if (cached && ttl && Date.now() < ttl) {
      return cached;
    }
    
    // Remove expired cache
    if (cached) {
      this.cache.delete(sessionId);
      this.cacheTTL.delete(sessionId);
    }
    
    return null;
  }

  setCache(sessionId, context) {
    this.cache.set(sessionId, context);
    this.cacheTTL.set(sessionId, Date.now() + this.CACHE_TTL);
  }

  invalidateCache(sessionId) {
    this.cache.delete(sessionId);
    this.cacheTTL.delete(sessionId);
  }

  // Helper methods
  mapUserToProfile(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      grade: user.grade,
      school: user.school,
      preferences: user.preferences
    };
  }

  mapMessageToContext(message) {
    return {
      id: message.id,
      sessionId: message.sessionId,
      userId: message.userId,
      sender: message.sender,
      type: message.messageType,
      content: message.content,
      imageUrl: message.imageUrl,
      timestamp: message.createdAt
    };
  }

  async ensureUserStats(userId) {
    try {
      const existingStats = await UserStats.findByUserId(userId);
      if (!existingStats) {
        await UserStats.create({
          userId,
          totalSessions: 0,
          totalMessages: 0,
          totalTextMessages: 0,
          totalVoiceMessages: 0,
          totalImageMessages: 0,
          totalTokensUsed: 0,
          lastActive: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error ensuring user stats:', error);
    }
  }

  async updateMessageStats(userId, messageType) {
    try {
      let userStats = await UserStats.findByUserId(userId);
      if (!userStats) {
        userStats = await UserStats.create({ userId });
      }

      await userStats.incrementMessages(messageType);
    } catch (error) {
      console.error('Error updating message stats:', error);
    }
  }

  async processWriteQueue() {
    if (this.isProcessingQueue || this.writeQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    try {
      const operations = this.writeQueue.splice(0, 10); // Process up to 10 operations
      await Promise.all(operations.map(op => op()));
    } catch (error) {
      console.error('Error processing write queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Health check method
  async healthCheck() {
    try {
      // Test database connection by trying to list users
      await User.count();
      return { status: 'healthy', cacheSize: this.cache.size };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}