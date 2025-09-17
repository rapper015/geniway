import { NextResponse } from 'next/server';
import { openaiService } from '../../../lib/openaiService';
import { connectDB } from '../../../../lib/mongodb';
import { ChatSession } from '../../../../models/ChatSession';
import { ChatMessage } from '../../../../models/ChatMessage';
import { UserStats } from '../../../../models/UserStats';
import { User } from '../../../../models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { message, messageType, imageUrl, sessionId, userId, subject, userName } = await request.json();

    // Validate required fields
    if (!message && !imageUrl) {
      return NextResponse.json(
        { error: 'Message content or image is required' },
        { status: 400 }
      );
    }

    // Get conversation history for context
    let conversationHistory = [];
    let userRole = 'student';

    if (sessionId) {
      try {
        await connectDB();
        
        // Get recent messages for context
        const messages = await ChatMessage.find({ sessionId: sessionId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        conversationHistory = messages.reverse().map(msg => ({
          type: msg.sender,
          content: msg.content,
          messageType: msg.messageType,
          timestamp: msg.createdAt
        }));

        // Get user role if userId provided
        if (userId) {
          const user = await User.findById(userId).lean();
          if (user) {
            userRole = user.role || 'student';
          }
        }
      } catch (dbError) {
        console.warn('Database error, continuing without context:', dbError);
      }
    }

    // Prepare context for OpenAI
    const context = openaiService.getConversationContext(
      conversationHistory,
      subject || 'general',
      userName || 'Student',
      userRole
    );

    // Process message based on type
    let aiResponse;
    
    if (messageType === 'image' && imageUrl) {
      // Process image with optional text
      aiResponse = await openaiService.processImageMessage(message, imageUrl, context);
    } else if (messageType === 'voice') {
      // Process voice transcript
      aiResponse = await openaiService.processVoiceMessage(message, context);
    } else {
      // Process text message
      aiResponse = await openaiService.processTextMessage(message, context);
    }

    if (!aiResponse.success) {
      return NextResponse.json(
        { 
          error: 'Failed to process message',
          details: aiResponse.error 
        },
        { status: 500 }
      );
    }

    // Save conversation to database if sessionId provided
    if (sessionId) {
      try {
        await connectDB();

        // Save user message
        if (message || imageUrl) {
          const userMessage = new ChatMessage({
            sessionId: sessionId,
            userId: userId,
            sender: 'user',
            messageType: messageType,
            content: message || 'Image uploaded',
            imageUrl: imageUrl,
            tokensUsed: 0
          });
          await userMessage.save();
        }

        // Save AI response
        const aiMessage = new ChatMessage({
          sessionId: sessionId,
          userId: userId,
          sender: 'ai',
          messageType: 'text',
          content: aiResponse.content,
          tokensUsed: aiResponse.usage?.total_tokens || 0,
          model: aiResponse.model
        });
        await aiMessage.save();

        // Update session with last activity
        await ChatSession.findByIdAndUpdate(
          sessionId,
          {
            $set: {
              lastActive: new Date()
            },
            $inc: {
              messageCount: 1
            }
          }
        );

        // Update user statistics
        if (userId) {
          const updateData = {
            $inc: {
              totalMessages: 1,
              totalTokensUsed: aiResponse.usage?.total_tokens || 0
            },
            $set: {
              lastActive: new Date()
            }
          };

          // Add message type specific increment
          const messageTypeKey = `total${messageType.charAt(0).toUpperCase() + messageType.slice(1)}Messages`;
          updateData.$inc[messageTypeKey] = 1;

          await UserStats.findOneAndUpdate(
            { userId: userId },
            updateData,
            { upsert: true, new: true }
          );
        }

      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Continue with response even if database save fails
      }
    }

    // Return AI response
    return NextResponse.json({
      success: true,
      content: aiResponse.content,
      messageType: 'text',
      usage: aiResponse.usage,
      model: aiResponse.model,
      hasImage: aiResponse.hasImage || false
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for conversation history
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit')) || 50;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get conversation history
    const messages = await ChatMessage.find({ sessionId: sessionId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id,
        type: msg.sender,
        content: msg.content,
        messageType: msg.messageType,
        imageUrl: msg.imageUrl,
        timestamp: msg.createdAt,
        tokensUsed: msg.tokensUsed
      }))
    });

  } catch (error) {
    console.error('Get Chat History Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' },
      { status: 500 }
    );
  }
}
