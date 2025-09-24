// Guest User Management System
// Handles guest user data storage and migration to authenticated user

export class GuestUserManager {
  constructor() {
    this.guestKey = 'geniway_guest_user';
    this.guestChatKey = 'geniway_guest_chat';
    this.guestStatsKey = 'geniway_guest_stats';
  }

  // Generate a unique guest ID
  generateGuestId() {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get or create guest user
  getGuestUser() {
    try {
      let guestUser = localStorage.getItem(this.guestKey);
      
      if (!guestUser) {
        // Create new guest user
        const newGuest = {
          id: this.generateGuestId(),
          name: 'Guest User',
          email: null,
          role: 'guest',
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          preferences: {
            selectedSubject: null,
            language: 'en',
            theme: 'light'
          }
        };
        
        localStorage.setItem(this.guestKey, JSON.stringify(newGuest));
        return newGuest;
      }
      
      const parsed = JSON.parse(guestUser);
      // Update last active time
      parsed.lastActive = new Date().toISOString();
      localStorage.setItem(this.guestKey, JSON.stringify(parsed));
      
      return parsed;
    } catch (error) {
      console.error('Error getting guest user:', error);
      return null;
    }
  }

  // Update guest user info
  updateGuestUser(updates) {
    try {
      const guestUser = this.getGuestUser();
      if (!guestUser) return false;

      const updatedUser = {
        ...guestUser,
        ...updates,
        lastActive: new Date().toISOString()
      };

      localStorage.setItem(this.guestKey, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Error updating guest user:', error);
      return false;
    }
  }

  // Save guest chat session
  saveGuestChatSession(sessionData) {
    try {
      const guestUser = this.getGuestUser();
      if (!guestUser) return false;

      const session = {
        id: `guest_session_${Date.now()}`,
        guestId: guestUser.id,
        subject: sessionData.subject,
        userName: sessionData.userName,
        createdAt: new Date().toISOString(),
        messages: sessionData.messages || [],
        messageCounts: sessionData.messageCounts || {
          text: 0,
          voice: 0,
          image: 0
        }
      };

      // Get existing sessions
      const existingSessions = this.getGuestChatSessions();
      existingSessions.push(session);
      
      localStorage.setItem(this.guestChatKey, JSON.stringify(existingSessions));
      return session;
    } catch (error) {
      console.error('Error saving guest chat session:', error);
      return false;
    }
  }

  // Get all guest chat sessions
  getGuestChatSessions() {
    try {
      const sessions = localStorage.getItem(this.guestChatKey);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error getting guest chat sessions:', error);
      return [];
    }
  }

  // Get current guest chat session
  getCurrentGuestSession() {
    try {
      const sessions = this.getGuestChatSessions();
      const guestUser = this.getGuestUser();
      
      if (!guestUser || sessions.length === 0) return null;
      
      // Return the most recent session
      return sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    } catch (error) {
      console.error('Error getting current guest session:', error);
      return null;
    }
  }

  // Add message to current guest session
  addMessageToGuestSession(message) {
    try {
      const sessions = this.getGuestChatSessions();
      const guestUser = this.getGuestUser();
      
      if (!guestUser || sessions.length === 0) return false;

      // Find the most recent session
      const currentSession = sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      
      // Add message
      currentSession.messages.push({
        ...message,
        timestamp: message.timestamp.toISOString()
      });

      // Update message counts
      if (message.messageType === 'text') {
        currentSession.messageCounts.text++;
      } else if (message.messageType === 'voice') {
        currentSession.messageCounts.voice++;
      } else if (message.messageType === 'image') {
        currentSession.messageCounts.image++;
      }

      // Update last active
      currentSession.lastActive = new Date().toISOString();

      localStorage.setItem(this.guestChatKey, JSON.stringify(sessions));
      return true;
    } catch (error) {
      console.error('Error adding message to guest session:', error);
      return false;
    }
  }

  // Save guest statistics
  saveGuestStats(stats) {
    try {
      const guestUser = this.getGuestUser();
      if (!guestUser) return false;

      const guestStats = {
        guestId: guestUser.id,
        totalSessions: stats.totalSessions || 0,
        totalMessages: stats.totalMessages || 0,
        totalTextMessages: stats.totalTextMessages || 0,
        totalVoiceMessages: stats.totalVoiceMessages || 0,
        totalImageMessages: stats.totalImageMessages || 0,
        favoriteSubject: stats.favoriteSubject || null,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(this.guestStatsKey, JSON.stringify(guestStats));
      return guestStats;
    } catch (error) {
      console.error('Error saving guest stats:', error);
      return false;
    }
  }

  // Get guest statistics
  getGuestStats() {
    try {
      const stats = localStorage.getItem(this.guestStatsKey);
      return stats ? JSON.parse(stats) : null;
    } catch (error) {
      console.error('Error getting guest stats:', error);
      return null;
    }
  }

  // Migrate guest data to authenticated user
  async migrateGuestDataToUser(authenticatedUser, authToken) {
    try {
      const guestUser = this.getGuestUser();
      const guestSessions = this.getGuestChatSessions();
      const guestStats = this.getGuestStats();

      if (!guestUser) {
        console.log('No guest data to migrate');
        return { success: true, message: 'No guest data to migrate' };
      }

      // Prepare migration data
      const migrationData = {
        guestId: guestUser.id,
        userId: authenticatedUser.id || authenticatedUser.id,
        sessions: guestSessions,
        stats: guestStats,
        preferences: guestUser.preferences
      };

      // Send to backend for migration
      const response = await fetch('/api/auth/migrate-guest-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(migrationData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Clear guest data after successful migration
        this.clearGuestData();
        
        return {
          success: true,
          message: 'Guest data migrated successfully',
          migratedSessions: result.migratedSessions || guestSessions.length,
          migratedMessages: result.migratedMessages || guestSessions.reduce((total, session) => total + session.messages.length, 0)
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          message: error.message || 'Failed to migrate guest data'
        };
      }
    } catch (error) {
      console.error('Error migrating guest data:', error);
      return {
        success: false,
        message: 'Network error during migration'
      };
    }
  }

  // Clear all guest data
  clearGuestData() {
    try {
      localStorage.removeItem(this.guestKey);
      localStorage.removeItem(this.guestChatKey);
      localStorage.removeItem(this.guestStatsKey);
      return true;
    } catch (error) {
      console.error('Error clearing guest data:', error);
      return false;
    }
  }

  // Check if user has guest data
  hasGuestData() {
    try {
      const guestUser = localStorage.getItem(this.guestKey);
      const guestSessions = localStorage.getItem(this.guestChatKey);
      return !!(guestUser || guestSessions);
    } catch (error) {
      console.error('Error checking guest data:', error);
      return false;
    }
  }

  // Get guest data summary
  getGuestDataSummary() {
    try {
      const guestUser = this.getGuestUser();
      const guestSessions = this.getGuestChatSessions();
      const guestStats = this.getGuestStats();

      return {
        hasData: this.hasGuestData(),
        guestUser,
        sessionCount: guestSessions.length,
        totalMessages: guestSessions.reduce((total, session) => total + session.messages.length, 0),
        stats: guestStats,
        lastActive: guestUser?.lastActive
      };
    } catch (error) {
      console.error('Error getting guest data summary:', error);
      return {
        hasData: false,
        guestUser: null,
        sessionCount: 0,
        totalMessages: 0,
        stats: null,
        lastActive: null
      };
    }
  }
}

// Create singleton instance
export const guestUserManager = new GuestUserManager();
