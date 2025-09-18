import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
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

    await connectDB();

    console.log('Creating session with data:', {
      userId: userId,
      userIdType: typeof userId,
      subject: subject,
      isGuest: isGuest
    });

    // Create new chat session with userId for all users (including guests)
    const sessionData = {
      userId: userId.toString(), // Always include userId for user-specific sessions
      subject: subject || 'general',
      isGuest: isGuest,
      status: 'active',
      messages: [],
      metadata: {
        createdAt: new Date(),
        lastActivity: new Date()
      }
    };

    const session = new ChatSessionNew(sessionData);

    console.log('Session object created:', session);

    await session.save();

    return NextResponse.json({
      success: true,
      sessionId: session._id.toString(),
      session: {
        id: session._id.toString(),
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

    await connectDB();

    let session;
    if (sessionId) {
      session = await ChatSessionNew.findById(sessionId);
    } else {
      // Find the most recent active session for the user
      session = await ChatSessionNew.findOne({ 
        userId: userId, 
        status: 'active' 
      }).sort({ createdAt: -1 });
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
        id: session._id.toString(),
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
