// Chat message storage and tracking utilities

export class ChatStorage {
  constructor() {
    this.storageKey = 'geniway_chat_history';
    this.currentSessionKey = 'geniway_current_session';
  }

  // Get all chat sessions
  getSessions() {
    try {
      const sessions = localStorage.getItem(this.storageKey);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      return [];
    }
  }

  // Save a new session
  saveSession(sessionData) {
    try {
      const sessions = this.getSessions();
      const newSession = {
        id: Date.now().toString(),
        subject: sessionData.subject,
        userName: sessionData.userName,
        createdAt: new Date().toISOString(),
        messages: [],
        messageCounts: {
          text: 0,
          voice: 0,
          image: 0
        }
      };
      
      sessions.push(newSession);
      localStorage.setItem(this.storageKey, JSON.stringify(sessions));
      localStorage.setItem(this.currentSessionKey, newSession.id);
      
      return newSession;
    } catch (error) {
      console.error('Error saving session:', error);
      return null;
    }
  }

  // Get current session
  getCurrentSession() {
    try {
      const sessionId = localStorage.getItem(this.currentSessionKey);
      if (!sessionId) return null;

      const sessions = this.getSessions();
      return sessions.find(session => session.id === sessionId) || null;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Add message to current session
  addMessage(message) {
    try {
      const sessions = this.getSessions();
      const sessionId = localStorage.getItem(this.currentSessionKey);
      
      if (!sessionId) return false;

      const sessionIndex = sessions.findIndex(session => session.id === sessionId);
      if (sessionIndex === -1) return false;

      const messageData = {
        id: message.id,
        type: message.type,
        content: message.content,
        messageType: message.messageType,
        imageUrl: message.imageUrl,
        timestamp: message.timestamp.toISOString()
      };

      sessions[sessionIndex].messages.push(messageData);
      
      // Update message counts
      if (message.messageType === 'text') {
        sessions[sessionIndex].messageCounts.text++;
      } else if (message.messageType === 'voice') {
        sessions[sessionIndex].messageCounts.voice++;
      } else if (message.messageType === 'image') {
        sessions[sessionIndex].messageCounts.image++;
      }

      localStorage.setItem(this.storageKey, JSON.stringify(sessions));
      return true;
    } catch (error) {
      console.error('Error adding message:', error);
      return false;
    }
  }

  // Get messages for current session
  getCurrentSessionMessages() {
    try {
      const session = this.getCurrentSession();
      return session ? session.messages : [];
    } catch (error) {
      console.error('Error getting current session messages:', error);
      return [];
    }
  }

  // Get session statistics
  getSessionStats() {
    try {
      const sessions = this.getSessions();
      const totalSessions = sessions.length;
      const totalMessages = sessions.reduce((sum, session) => {
        return sum + session.messages.length;
      }, 0);
      
      const totalTextMessages = sessions.reduce((sum, session) => {
        return sum + session.messageCounts.text;
      }, 0);
      
      const totalVoiceMessages = sessions.reduce((sum, session) => {
        return sum + session.messageCounts.voice;
      }, 0);
      
      const totalImageMessages = sessions.reduce((sum, session) => {
        return sum + session.messageCounts.image;
      }, 0);

      return {
        totalSessions,
        totalMessages,
        totalTextMessages,
        totalVoiceMessages,
        totalImageMessages
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        totalTextMessages: 0,
        totalVoiceMessages: 0,
        totalImageMessages: 0
      };
    }
  }

  // Clear all chat history
  clearAllHistory() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.currentSessionKey);
      return true;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return false;
    }
  }

  // Export chat data
  exportChatData() {
    try {
      const sessions = this.getSessions();
      const stats = this.getSessionStats();
      
      return {
        sessions,
        stats,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting chat data:', error);
      return null;
    }
  }
}

// Create a singleton instance
export const chatStorage = new ChatStorage();
