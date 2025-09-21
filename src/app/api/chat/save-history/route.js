import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { ChatMessage } from '../../../../../models/ChatMessage';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    console.log('[save-history] API called');
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
     let decoded; 
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { messages, sessionId } = await request.json();
    console.log('[save-history] Saving chat history:', { 
      userId: decoded.userId, 
      messageCount: messages?.length || 0, 
      sessionId 
    });

    await connectDB();

    // Find or create chat session
    let chatSession;
    if (sessionId) {
      chatSession = await ChatSession.findById(sessionId);
    }

    if (!chatSession) {
      // Create new chat session
      chatSession = new ChatSession({
        userId: decoded.userId,
        subject: 'general',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await chatSession.save();
    }

    // Save messages as ChatMessage objects
    const savedMessageIds = [];
    for (const message of messages || []) {
      const chatMessage = new ChatMessage({
        sessionId: chatSession._id,
        userId: decoded.userId,
        sender: message.type === 'ai' ? 'ai' : 'user',
        messageType: message.messageType || 'text',
        content: message.content,
        imageUrl: message.imageUrl || undefined,
        createdAt: message.timestamp ? new Date(message.timestamp) : new Date()
      });
      
      await chatMessage.save();
      savedMessageIds.push(chatMessage._id);
    }

    // Update session with message references
    chatSession.messages = [...(chatSession.messages || []), ...savedMessageIds];
    chatSession.messageCount = chatSession.messages.length;
    chatSession.lastActive = new Date();
    await chatSession.save();

    console.log('[save-history] Chat session saved:', chatSession._id, 'with', savedMessageIds.length, 'messages');

    return NextResponse.json({
      success: true,
      sessionId: chatSession._id,
      messageCount: chatSession.messages.length
    });

  } catch (error) {
    console.error('[save-history] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save chat history' },
      { status: 500 }
    );
  }
}
