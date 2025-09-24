import { NextResponse } from 'next/server';
import { openaiService } from '../../../lib/openaiService';
import { connectDB } from '../../../../lib/mongodb';
import ChatSession from '../../../../models/ChatSession';
import { ChatMessage } from '../../../../models/ChatMessage';
import { UserStats } from '../../../../models/UserStats';
import { User } from '../../../../models/User';
import jwt from 'jsonwebtoken';

// Configure API route to handle larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export async function POST(request) {
  try {
    // Check content length before parsing
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
      return NextResponse.json(
        { error: 'Request payload too large. Maximum size is 10MB.' },
        { status: 413 }
      );
    }

    const { message, messageType, imageUrl, sessionId, userId, subject, userName } = await request.json();

    // Validate required fields
    if (!message && !imageUrl) {
      return NextResponse.json(
        { error: 'Message content or image is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user if userId is provided
    let user = null;
    if (userId) {
      try {
        user = await User.findById(userId);
        if (!user) {
          user = await User.findOne({ email: userId });
        }
      } catch (error) {
        console.log('User verification failed, continuing as guest:', error.message);
      }
    }

    // Get or create session
    let session = await ChatSession.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Create user message
    const userMessage = new ChatMessage({
      sessionId: session._id,
      userId: userId || 'anonymous',
      sender: 'user',
      messageType: messageType || 'text',
      content: message || 'Image uploaded',
      imageUrl: imageUrl || null,
      timestamp: new Date()
    });

    await userMessage.save();

    // Update session
    session.messageCount += 1;
    session.lastActive = new Date();
    await session.save();

    // Update user stats
    if (userId) {
      await UserStats.findOneAndUpdate(
        { userId: userId },
        {
          $inc: {
            totalMessages: 1,
            totalTextMessages: messageType === 'text' ? 1 : 0,
            totalVoiceMessages: messageType === 'voice' ? 1 : 0,
            totalImageMessages: messageType === 'image' ? 1 : 0
          },
          $set: { lastActivity: new Date() }
        },
        { upsert: true }
      );
    }

    // Generate AI response
    let aiResponse;
    try {
      if (imageUrl) {
        // Handle image + text message
        aiResponse = await openaiService.generateImageResponse(message, imageUrl, subject);
      } else {
        // Handle text-only message
        aiResponse = await openaiService.generateResponse(message, subject);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      aiResponse = {
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        tokenUsage: 0,
        model: 'error'
      };
    }

    // Create AI message
    const aiMessage = new ChatMessage({
      sessionId: session._id,
      userId: userId || 'anonymous',
      sender: 'ai',
      messageType: 'text',
      content: aiResponse.content,
      timestamp: new Date(),
      metadata: {
        tokenUsage: aiResponse.tokenUsage || 0,
        model: aiResponse.model || 'gpt-4o',
        responseTime: aiResponse.responseTime || 0
      }
    });

    await aiMessage.save();

    // Update session again
    session.messageCount += 1;
    session.lastActive = new Date();
    await session.save();

    // Update user stats for AI response
    if (userId) {
      await UserStats.findOneAndUpdate(
        { userId: userId },
        {
          $inc: { totalMessages: 1, totalTextMessages: 1 },
          $set: { lastActivity: new Date() }
        },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      userMessage: {
        id: userMessage._id,
        content: userMessage.content,
        messageType: userMessage.messageType,
        imageUrl: userMessage.imageUrl,
        timestamp: userMessage.timestamp
      },
      aiMessage: {
        id: aiMessage._id,
        content: aiMessage.content,
        messageType: aiMessage.messageType,
        timestamp: aiMessage.timestamp,
        metadata: aiMessage.metadata
      },
      sessionId: session._id
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific error types
    if (error.message && error.message.includes('too large')) {
      return NextResponse.json(
        { error: 'Request payload too large. Please compress your image and try again.' },
        { status: 413 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}