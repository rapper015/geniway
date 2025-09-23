// Context Recovery System for Chat Sessions
// Handles recovery from failed sessions and maintains chat continuity

export class ContextRecovery {
  constructor() {
    this.recoveryAttempts = new Map();
    this.maxRecoveryAttempts = 3;
    this.recoveryDelay = 2000; // 2 seconds
  }

  // Attempt to recover context for a failed session
  async recoverSessionContext(sessionId, userId, subject) {
    const attemptKey = `${sessionId}_${userId}`;
    const attempts = this.recoveryAttempts.get(attemptKey) || 0;

    if (attempts >= this.maxRecoveryAttempts) {
      console.warn(`[ContextRecovery] Max recovery attempts reached for session ${sessionId}`);
      return null;
    }

    this.recoveryAttempts.set(attemptKey, attempts + 1);

    try {
      
      // Wait before retry
      await this.delay(this.recoveryDelay * (attempts + 1));

      // Try to recover session from database
      const recoveredContext = await this.recoverFromDatabase(sessionId, userId, subject);
      
      if (recoveredContext) {
        this.recoveryAttempts.delete(attemptKey);
        return recoveredContext;
      }

      // Try to recover from local storage as fallback
      const localContext = await this.recoverFromLocalStorage(sessionId, userId, subject);
      
      if (localContext) {
        this.recoveryAttempts.delete(attemptKey);
        return localContext;
      }

      // Create minimal context as last resort
      const minimalContext = this.createMinimalContext(sessionId, userId, subject);
      return minimalContext;

    } catch (error) {
      console.error(`[ContextRecovery] Recovery attempt ${attempts + 1} failed:`, error);
      
      if (attempts + 1 >= this.maxRecoveryAttempts) {
        this.recoveryAttempts.delete(attemptKey);
        return this.createMinimalContext(sessionId, userId, subject);
      }
      
      return null;
    }
  }

  // Recover context from database
  async recoverFromDatabase(sessionId, userId, subject) {
    try {
      const ChatSessionNew = (await import('../../models/ChatSessionNew')).default;
      const { ChatMessage } = await import('../../models/ChatMessage');

      // Try to find session
      const session = await ChatSessionNew.findById(sessionId);
      if (!session) {
        return null;
      }

      // Get recent messages
      const messages = await ChatMessage.getSessionMessages(sessionId, 50, 0);

      return {
        sessionId: session.id,
        userId: userId,
        subject: session.subject || subject || 'general',
        messageHistory: messages,
        curriculumContext: {
          subject: session.subject || subject || 'general',
          class: '10',
          board: 'CBSE',
          language: 'en'
        },
        recovered: true,
        recoverySource: 'database'
      };

    } catch (error) {
      console.error('[ContextRecovery] Database recovery failed:', error);
      return null;
    }
  }

  // Recover context from local storage
  async recoverFromLocalStorage(sessionId, userId, subject) {
    try {
      if (typeof window === 'undefined') {
        return null; // Server-side, no localStorage
      }

      const storageKey = `geniway_session_${sessionId}`;
      const storedContext = localStorage.getItem(storageKey);
      
      if (!storedContext) {
        return null;
      }

      const parsedContext = JSON.parse(storedContext);
      
      // Validate stored context
      if (!parsedContext.sessionId || !parsedContext.userId) {
        return null;
      }

      return {
        ...parsedContext,
        recovered: true,
        recoverySource: 'localStorage'
      };

    } catch (error) {
      console.error('[ContextRecovery] Local storage recovery failed:', error);
      return null;
    }
  }

  // Create minimal context as last resort
  createMinimalContext(sessionId, userId, subject) {
    return {
      sessionId: sessionId,
      userId: userId,
      subject: subject || 'general',
      messageHistory: [],
      curriculumContext: {
        subject: subject || 'general',
        class: '10',
        board: 'CBSE',
        language: 'en'
      },
      recovered: true,
      recoverySource: 'minimal',
      isMinimal: true
    };
  }

  // Store context in local storage for recovery
  storeContextForRecovery(sessionId, context) {
    try {
      if (typeof window === 'undefined') {
        return; // Server-side, no localStorage
      }

      const storageKey = `geniway_session_${sessionId}`;
      const contextToStore = {
        ...context,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(storageKey, JSON.stringify(contextToStore));
      
      // Clean up old stored contexts (keep only last 10)
      this.cleanupOldContexts();

    } catch (error) {
      console.error('[ContextRecovery] Failed to store context:', error);
    }
  }

  // Clean up old stored contexts
  cleanupOldContexts() {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('geniway_session_')
      );

      if (keys.length > 10) {
        // Sort by last updated and remove oldest
        const contextsWithTime = keys.map(key => {
          try {
            const context = JSON.parse(localStorage.getItem(key));
            return {
              key,
              lastUpdated: new Date(context.lastUpdated || 0)
            };
          } catch {
            return { key, lastUpdated: new Date(0) };
          }
        });

        contextsWithTime.sort((a, b) => a.lastUpdated - b.lastUpdated);

        // Remove oldest contexts
        const toRemove = contextsWithTime.slice(0, keys.length - 10);
        toRemove.forEach(({ key }) => {
          localStorage.removeItem(key);
        });

      }

    } catch (error) {
      console.error('[ContextRecovery] Failed to cleanup old contexts:', error);
    }
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear recovery attempts for a session
  clearRecoveryAttempts(sessionId, userId) {
    const attemptKey = `${sessionId}_${userId}`;
    this.recoveryAttempts.delete(attemptKey);
  }

  // Get recovery status for a session
  getRecoveryStatus(sessionId, userId) {
    const attemptKey = `${sessionId}_${userId}`;
    const attempts = this.recoveryAttempts.get(attemptKey) || 0;
    
    return {
      attempts,
      maxAttempts: this.maxRecoveryAttempts,
      canRecover: attempts < this.maxRecoveryAttempts
    };
  }
}

// Export singleton instance
export const contextRecovery = new ContextRecovery();