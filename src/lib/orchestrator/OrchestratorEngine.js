import { TutoringOrchestrator } from './TutoringOrchestrator';
import { DatabaseStateManager } from './DatabaseStateManager';

export class OrchestratorEngine {
  constructor(config = {}) {
    this.orchestrator = new TutoringOrchestrator();
    this.stateManager = new DatabaseStateManager();
    this.activeSessions = new Map();
    this.config = {
      maxSectionsPerSession: 10,
      maxStepsPerSection: 5,
      maxTokensPerResponse: 2000,
      timeoutMs: 60000, // 60 seconds
      enableStreaming: true,
      enableOfflineMode: true,
      modelRouting: {
        primary: 'gpt-4o',
        fallback: 'gpt-4o-mini'
      },
      ...config
    };

    // Clean up inactive sessions every 5 minutes
    setInterval(() => this.cleanupInactiveSessions(), 5 * 60 * 1000);
  }

  async processRequest(sessionId, studentInput, onEvent) {
    const startTime = Date.now();
    
    try {
      // Validate session
      const context = await this.stateManager.getCurrentState(sessionId);
      if (!context) {
        throw new Error('Session not found or expired');
      }

      // Check session limits
      if (context.previousSections.length >= this.config.maxSectionsPerSession) {
        throw new Error('Session limit reached. Please start a new session.');
      }

      // Update session activity
      this.updateSessionActivity(sessionId);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (onEvent) {
          onEvent({
            type: 'error',
            data: {
              error: 'Request timeout',
              code: 'TIMEOUT',
              retryable: true
            },
            timestamp: new Date(),
            sessionId
          });
        }
      }, this.config.timeoutMs);

      try {
        // Process the student input
        const sections = await this.orchestrator.processStudentInput(
          sessionId,
          studentInput,
          onEvent
        );

        clearTimeout(timeoutId);

        // Update context with new sections
        await this.stateManager.updateState(sessionId, {
          previousSections: [...context.previousSections, ...sections]
        });

        return {
          success: true,
          sections
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }

    } catch (error) {
      console.error('OrchestratorEngine error:', error);
      
      // Send error event
      if (onEvent) {
        onEvent({
          type: 'error',
          data: {
            error: error.message,
            code: 'ORCHESTRATOR_ERROR',
            retryable: true
          },
          timestamp: new Date(),
          sessionId
        });
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  async createSession(userId, subject) {
    try {
      const sessionId = await this.stateManager.createSession(userId, subject);
      
      // Track the new session
      this.activeSessions.set(sessionId, {
        lastActivity: new Date(),
        timeout: setTimeout(() => {
          this.expireSession(sessionId);
        }, 30 * 60 * 1000) // 30 minutes timeout
      });

      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSessionContext(sessionId) {
    try {
      return await this.stateManager.getCurrentState(sessionId);
    } catch (error) {
      console.error('Error getting session context:', error);
      return null;
    }
  }

  async getSessionMessages(sessionId, limit = 50) {
    try {
      return await this.stateManager.getMessages(sessionId, limit);
    } catch (error) {
      console.error('Error getting session messages:', error);
      return [];
    }
  }

  async validateMCQAnswer(sessionId, questionId, selectedAnswer) {
    try {
      this.updateSessionActivity(sessionId);
      return await this.orchestrator.validateMCQAnswer(sessionId, questionId, selectedAnswer);
    } catch (error) {
      console.error('Error validating MCQ answer:', error);
      throw error;
    }
  }

  async getHint(sessionId, sectionId, hintLevel) {
    try {
      this.updateSessionActivity(sessionId);
      return await this.orchestrator.getHint(sessionId, sectionId, hintLevel);
    } catch (error) {
      console.error('Error getting hint:', error);
      throw error;
    }
  }

  async getSessionSummary(sessionId) {
    try {
      return await this.orchestrator.getSessionSummary(sessionId);
    } catch (error) {
      console.error('Error getting session summary:', error);
      throw error;
    }
  }

  async expireSession(sessionId) {
    try {
      // Clear session tracking
      const session = this.activeSessions.get(sessionId);
      if (session) {
        clearTimeout(session.timeout);
        this.activeSessions.delete(sessionId);
      }

      // Update database
      await this.stateManager.expireSession(sessionId);
    } catch (error) {
      console.error('Error expiring session:', error);
    }
  }

  updateSessionActivity(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      // Clear existing timeout
      clearTimeout(session.timeout);
      
      // Update activity time
      session.lastActivity = new Date();
      
      // Set new timeout
      session.timeout = setTimeout(() => {
        this.expireSession(sessionId);
      }, 30 * 60 * 1000); // 30 minutes
    }
  }

  cleanupInactiveSessions() {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity.getTime() > inactiveThreshold) {
        console.log(`Cleaning up inactive session: ${sessionId}`);
        this.expireSession(sessionId);
      }
    }
  }

  // Health check method
  async healthCheck() {
    const errors = [];
    let status = 'healthy';

    try {
      // Check database connection
      const context = await this.stateManager.getCurrentState('health-check');
      if (!context) {
        // This is expected for health check
      }
    } catch (error) {
      errors.push(`Database connection failed: ${error.message}`);
      status = 'unhealthy';
    }

    // Check active sessions
    const activeSessions = this.activeSessions.size;
    if (activeSessions > 1000) {
      errors.push('Too many active sessions');
      status = 'degraded';
    }

    return {
      status,
      activeSessions,
      uptime: process.uptime(),
      errors
    };
  }

  // Configuration update method
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('OrchestratorEngine configuration updated:', this.config);
  }

  // Get current configuration
  getConfig() {
    return { ...this.config };
  }

  // Get session statistics
  getSessionStats() {
    const activeSessions = this.activeSessions.size;
    const now = Date.now();
    
    let totalDuration = 0;
    for (const session of this.activeSessions.values()) {
      totalDuration += now - session.lastActivity.getTime();
    }
    
    const averageSessionDuration = activeSessions > 0 ? totalDuration / activeSessions : 0;

    return {
      activeSessions,
      totalSessions: activeSessions, // This would be tracked in database in production
      averageSessionDuration
    };
  }
}
