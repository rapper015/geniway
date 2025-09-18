
import { connectDB } from '../../../lib/mongodb';
import ChatSessionNew from '../../../models/ChatSessionNew';
import { ChatMessage } from '../../../models/ChatMessage';
import { UserStats } from '../../../models/UserStats';
import { User } from '../../../models/User';
import OpenAI from 'openai';

export class SimpleOrchestrator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async processStudentInput(sessionId, studentInput, onEvent) {
    try {
      // Get or create session
      let session = await this.getSession(sessionId);
      if (!session) {
        session = await this.createSession(studentInput.userId, studentInput.subject);
      }

      // Add user message
      await this.addMessage({
        sessionId: session._id.toString(),
        userId: studentInput.userId,
        sender: 'user',
        messageType: studentInput.type,
        content: studentInput.text,
        imageUrl: studentInput.imageUrl
      });

      // Generate AI response
      const aiResponse = await this.generateResponse(studentInput, session);
      
      // Add AI message
      const aiMessage = await this.addMessage({
        sessionId: session._id.toString(),
        userId: studentInput.userId,
        sender: 'ai',
        messageType: 'text',
        content: aiResponse.content
      });

      // Send events
      if (onEvent) {
        onEvent({
          type: 'section',
          data: {
            section: {
              id: `section-${Date.now()}`,
              type: 'response',
              title: '',
              content: aiResponse.content,
              isCompleted: true
            },
            isComplete: true
          },
          timestamp: new Date(),
          sessionId: session._id.toString()
        });

        onEvent({
          type: 'final',
          data: {
            section: {
              id: `section-${Date.now()}`,
              type: 'response',
              title: '',
              content: aiResponse.content,
              isCompleted: true
            },
            performance: {
              ttft: 500,
              totalTime: 2000,
              tokensGenerated: aiResponse.tokensUsed || 0
            }
          },
          timestamp: new Date(),
          sessionId: session._id.toString()
        });
      }

      return {
        success: true,
        message: aiMessage,
        response: aiResponse
      };
    } catch (error) {
      console.error('Error processing student input:', error);
      
      if (onEvent) {
        onEvent({
          type: 'error',
          data: {
            error: error.message,
            code: 'PROCESSING_ERROR',
            retryable: true
          },
          timestamp: new Date(),
          sessionId
        });
      }
      
      throw error;
    }
  }

  async getSession(sessionId) {
    try {
      await connectDB();
      return await ChatSessionNew.findById(sessionId);
    } catch (error) {
      console.error('Error getting session:', error);
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
      
      return savedSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
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

  async generateResponse(studentInput, session) {
    try {
      // Get recent conversation history
      const messages = await this.getRecentMessages(session._id.toString(), 10);
      
      // Build conversation context
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Create system prompt
      const systemPrompt = `You are Geni Ma'am, an expert AI tutor specializing in personalized education for students. 

Your role:
- Be encouraging, patient, and supportive
- Use age-appropriate language and examples
- Break down complex concepts into simple steps
- Provide clear explanations with examples
- Encourage critical thinking
- Make learning fun and engaging

Current subject: ${session.subject || 'general'}
Student input: ${studentInput.text}

Respond in a helpful, educational manner. If the student uploaded an image, analyze it and provide relevant educational content.`;

      // Add system prompt to conversation
      conversationHistory.unshift({ role: 'system', content: systemPrompt });

      // Generate response using OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
      const tokensUsed = response.usage?.total_tokens || 0;

      return {
        content,
        tokensUsed,
        model: 'gpt-4o'
      };
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback response
      return {
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        tokensUsed: 0,
        model: 'fallback'
      };
    }
  }

  async getRecentMessages(sessionId, limit = 10) {
    try {
      await connectDB();
      
      const messages = await ChatMessage.find({ sessionId })
        .sort({ createdAt: -1 })
        .limit(limit);

      return messages.map(msg => ({
        id: msg._id.toString(),
        sessionId: msg.sessionId,
        userId: msg.userId,
        sender: msg.sender,
        type: msg.messageType,
        content: msg.content,
        imageUrl: msg.imageUrl,
        timestamp: msg.createdAt
      })).reverse();
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
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
}
