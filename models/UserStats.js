import { replitDB } from '../lib/replit-db.js';

export class UserStats {
  constructor(data = {}) {
    this.userId = data.userId || null;
    this.totalMessages = data.totalMessages || 0;
    this.totalTextMessages = data.totalTextMessages || 0;
    this.totalVoiceMessages = data.totalVoiceMessages || 0;
    this.totalImageMessages = data.totalImageMessages || 0;
    this.totalTokensUsed = data.totalTokensUsed || 0;
    this.totalSessions = data.totalSessions || 0;
    this.lastActive = data.lastActive || new Date().toISOString();
    
    // Additional statistics
    this.averageSessionLength = data.averageSessionLength || 0;
    this.favoriteSubject = data.favoriteSubject || null;
    this.mostUsedMode = data.mostUsedMode || 'step-by-step';
    this.streakDays = data.streakDays || 0;
    this.lastStreakDate = data.lastStreakDate || null;
    this.totalStudyTime = data.totalStudyTime || 0; // in minutes
    
    // Performance metrics
    this.averageTokensPerMessage = data.averageTokensPerMessage || 0;
    this.mostActiveHour = data.mostActiveHour || null;
    this.weeklyActivity = data.weeklyActivity || {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    };
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Static methods for database operations
  static async create(statsData) {
    const stats = new UserStats(statsData);
    const id = replitDB.generateId();
    const savedStats = await replitDB.create('user_stats', id, stats);
    return new UserStats(savedStats);
  }

  static async findById(id) {
    const statsData = await replitDB.findById('user_stats', id);
    return statsData ? new UserStats(statsData) : null;
  }

  static async findByUserId(userId) {
    const statsData = await replitDB.findOne('user_stats', { userId });
    return statsData ? new UserStats(statsData) : null;
  }

  static async findOne(query) {
    const statsData = await replitDB.findOne('user_stats', query);
    return statsData ? new UserStats(statsData) : null;
  }

  static async find(query = {}) {
    const statsData = await replitDB.find('user_stats', query);
    return statsData.map(data => new UserStats(data));
  }

  static async updateById(id, updateData) {
    const updatedData = await replitDB.update('user_stats', id, updateData);
    return new UserStats(updatedData);
  }

  static async deleteById(id) {
    return await replitDB.delete('user_stats', id);
  }

  static async count(query = {}) {
    return await replitDB.count('user_stats', query);
  }

  // Get or create stats for a user
  static async getOrCreateUserStats(userId) {
    let stats = await UserStats.findByUserId(userId);
    
    if (!stats) {
      stats = await UserStats.create({ userId });
    }
    
    return stats;
  }

  // Get top users by activity
  static async getTopUsers(limit = 10, sortBy = 'totalMessages') {
    const allStats = await replitDB.list('user_stats');
    
    // Sort by the specified field
    allStats.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
    
    return allStats.slice(0, limit).map(data => new UserStats(data));
  }

  // Get user activity summary
  static async getUserActivitySummary(userId) {
    const stats = await UserStats.findByUserId(userId);
    if (!stats) return null;

    return {
      totalMessages: stats.totalMessages,
      totalSessions: stats.totalSessions,
      totalTokens: stats.totalTokensUsed,
      averageSessionLength: stats.averageSessionLength,
      favoriteSubject: stats.favoriteSubject,
      streakDays: stats.streakDays,
      totalStudyTime: stats.totalStudyTime,
      lastActive: stats.lastActive
    };
  }

  // Instance methods
  async save() {
    if (this.id) {
      const updatedData = await replitDB.update('user_stats', this.id, this);
      Object.assign(this, updatedData);
      return this;
    } else {
      const id = replitDB.generateId();
      const savedData = await replitDB.create('user_stats', id, this);
      Object.assign(this, savedData);
      return this;
    }
  }

  async incrementMessages(messageType = 'text') {
    this.totalMessages += 1;
    
    switch (messageType) {
      case 'text':
        this.totalTextMessages += 1;
        break;
      case 'voice':
        this.totalVoiceMessages += 1;
        break;
      case 'image':
        this.totalImageMessages += 1;
        break;
    }
    
    this.lastActive = new Date().toISOString();
    await this.save();
  }

  async addTokens(tokens) {
    this.totalTokensUsed += tokens;
    this.averageTokensPerMessage = this.totalMessages > 0 ? 
      this.totalTokensUsed / this.totalMessages : 0;
    await this.save();
  }

  async incrementSessions() {
    this.totalSessions += 1;
    await this.save();
  }

  async updateSessionLength(sessionLength) {
    // Update average session length
    if (this.totalSessions > 0) {
      this.averageSessionLength = 
        ((this.averageSessionLength * (this.totalSessions - 1)) + sessionLength) / this.totalSessions;
    } else {
      this.averageSessionLength = sessionLength;
    }
    
    // Add to total study time
    this.totalStudyTime += sessionLength;
    
    await this.save();
  }

  async updateFavoriteSubject(subject) {
    this.favoriteSubject = subject;
    await this.save();
  }

  async updateMostUsedMode(mode) {
    this.mostUsedMode = mode;
    await this.save();
  }

  async updateStreak() {
    const today = new Date().toDateString();
    const lastStreakDate = this.lastStreakDate ? new Date(this.lastStreakDate).toDateString() : null;
    
    if (lastStreakDate === today) {
      // Already updated today
      return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    if (lastStreakDate === yesterdayString) {
      // Continue streak
      this.streakDays += 1;
    } else {
      // Reset streak
      this.streakDays = 1;
    }
    
    this.lastStreakDate = new Date().toISOString();
    await this.save();
  }

  async updateWeeklyActivity() {
    const dayOfWeek = new Date().getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    this.weeklyActivity[dayName] += 1;
    await this.save();
  }

  async updateMostActiveHour() {
    const hour = new Date().getHours();
    this.mostActiveHour = hour;
    await this.save();
  }

  // Get formatted statistics
  getFormattedStats() {
    return {
      totalMessages: this.totalMessages,
      totalSessions: this.totalSessions,
      totalTokens: this.totalTokensUsed,
      averageSessionLength: Math.round(this.averageSessionLength),
      favoriteSubject: this.favoriteSubject,
      mostUsedMode: this.mostUsedMode,
      streakDays: this.streakDays,
      totalStudyTime: this.formatStudyTime(this.totalStudyTime),
      averageTokensPerMessage: Math.round(this.averageTokensPerMessage),
      mostActiveHour: this.mostActiveHour,
      weeklyActivity: this.weeklyActivity,
      lastActive: this.lastActive
    };
  }

  formatStudyTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  // Validation
  validate() {
    const errors = [];
    
    if (!this.userId) {
      errors.push('User ID is required');
    }
    
    if (this.totalMessages < 0) {
      errors.push('Total messages cannot be negative');
    }
    
    if (this.totalTokensUsed < 0) {
      errors.push('Total tokens used cannot be negative');
    }
    
    if (this.totalSessions < 0) {
      errors.push('Total sessions cannot be negative');
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
export { UserStats as default };