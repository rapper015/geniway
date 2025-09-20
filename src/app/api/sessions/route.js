import { NextResponse } from 'next/server';
import ChatSessionNew from '../../../../models/ChatSessionNew';

export async function POST(request) {
  try {
    const { userId, subject, isGuest = false } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Creating session with data:', {
      userId: userId,
      userIdType: typeof userId,
      subject: subject,
      isGuest: isGuest
    });

    // Create new chat session with userId for all users (including guests)
    const session = await ChatSessionNew.create({
      userId: userId.toString(), // Always include userId for user-specific sessions
      subject: subject || 'general',
      isGuest: isGuest,
      status: 'active',
      messages: [],
      metadata: {
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      }
    });

    console.log('Session object created:', session);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      session: {
        id: session.id,
        userId: session.userId,
        subject: session.subject,
        isGuest: session.isGuest,
        status: session.status,
        createdAt: session.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: 'Session ID or User ID is required' },
        { status: 400 }
      );
    }

    let session;
    if (sessionId) {
      session = await ChatSessionNew.findById(sessionId);
    } else {
      // Find the most recent active session for the user
      const sessions = await ChatSessionNew.find({ 
        userId: userId, 
        status: 'active' 
      });
      // Sort by creation time (newest first)
      sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      session = sessions[0] || null;
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        userId: session.userId,
        subject: session.subject,
        isGuest: session.isGuest,
        status: session.status,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });

  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
