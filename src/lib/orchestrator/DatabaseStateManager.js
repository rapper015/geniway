import { connectDB } from '../../../lib/mongodb';
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
      await connectDB();
      
      // Fetch session and messages from database
      const session = await ChatSessionNew.findById(sessionId);
      if (!session) {
        return null;
      }

      const messages = await ChatMessage.find({ sessionId })
        .sort({ createdAt: 1 })
        .limit(100); // Limit to last 100 messages for performance

      // Fetch user profile
      const user = await User.findById(session.userId);
      const userProfile = user ? this.mapUserToProfile(user) : undefined;

      // Build tutoring context
      const context = {
        sessionId,
        userId: session.userId.toString(),
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
      await connectDB();
      
      const session = new ChatSessionNew({
        userId,
        subject,
        title: `Chat - ${new Date().toLocaleDateString()}`,
        messageCount: 0,
        createdAt: new Date(),
        lastActive: new Date()
      });

      const savedSession = await session.save();
      
      // Initialize user stats if not exists
      await this.ensureUserStats(userId);
      
      return savedSession._id.toString();
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async updateState(sessionId, updates) {
    try {
      await connectDB();
      
      // Update session
      await ChatSessionNew.findByIdAndUpdate(sessionId, {
        lastActive: new Date(),
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
      await connectDB();
      
      const messages = await ChatMessage.find({ sessionId })
        .sort({ createdAt: -1 })
        .limit(limit);

      return messages.map(msg => this.mapMessageToContext(msg)).reverse();
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async addMessage(messageData) {
    try {
      await connectDB();
      
      const message = new ChatMessage({
        sessionId: messageData.sessionId,
        userId: messageData.userId,
        sender: messageData.sender,
        messageType: messageData.messageType,
        content: messageData.content,
        imageUrl: messageData.imageUrl,
        createdAt: new Date()
      });

      const savedMessage = await message.save();

      // Update session message count
      await ChatSessionNew.findByIdAndUpdate(messageData.sessionId, {
        $inc: { messageCount: 1 },
        lastActive: new Date()
      });

      // Update user stats
      await this.updateMessageStats(messageData.userId, messageData.messageType);

      // Invalidate cache
      this.invalidateCache(messageData.sessionId);

      return {
        id: savedMessage._id.toString(),
        sessionId: messageData.sessionId,
        userId: messageData.userId,
        sender: messageData.sender,
        type: messageData.messageType,
        content: messageData.content,
        imageUrl: messageData.imageUrl,
        timestamp: savedMessage.createdAt
      };
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  async expireSession(sessionId) {
    try {
      await connectDB();
      
      // Update session status
      await ChatSessionNew.findByIdAndUpdate(sessionId, {
        status: 'archived',
        lastActive: new Date()
      });

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
      id: user._id.toString(),
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
      id: message._id.toString(),
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
      const existingStats = await UserStats.findOne({ userId });
      if (!existingStats) {
        const stats = new UserStats({
          userId,
          totalSessions: 0,
          totalMessages: 0,
          totalTextMessages: 0,
          totalVoiceMessages: 0,
          totalImageMessages: 0,
          totalTokensUsed: 0,
          lastActive: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await stats.save();
      }
    } catch (error) {
      console.error('Error ensuring user stats:', error);
    }
  }

  async updateMessageStats(userId, messageType) {
    try {
      const updateFields = {
        $inc: { totalMessages: 1 },
        $set: { lastActive: new Date(), updatedAt: new Date() }
      };

      switch (messageType) {
        case 'text':
          updateFields.$inc.totalTextMessages = 1;
          break;
        case 'voice':
          updateFields.$inc.totalVoiceMessages = 1;
          break;
        case 'image':
          updateFields.$inc.totalImageMessages = 1;
          break;
      }

      await UserStats.findOneAndUpdate(
        { userId },
        updateFields,
        { upsert: true }
      );
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
      await connectDB();
      return { status: 'healthy', cacheSize: this.cache.size };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}