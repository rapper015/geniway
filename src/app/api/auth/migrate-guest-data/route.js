import { NextResponse } from 'next/server';
import { User } from '../../../../../models/User';
import ChatSessionNew from '../../../../../models/ChatSessionNew';
import { ChatMessage } from '../../../../../models/ChatMessage';
import { UserStats } from '../../../../../models/UserStats';
import { replitDB } from '../../../../../lib/replit-db';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
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

    const { guestId, userId, sessions, stats, preferences } = await request.json();

    if (!guestId || !userId) {
      return NextResponse.json(
        { error: 'Guest ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Migrate chat sessions
    let migratedSessions = 0;
    let migratedMessages = 0;

    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        // Create session document
        const savedSession = await ChatSessionNew.create({
          userId: userId,
          subject: session.subject,
          title: session.title || 'Migrated Chat',
          messageCount: session.messageCount || 0,
          createdAt: session.createdAt,
          lastActive: session.lastActive || session.createdAt
        });

        const sessionId = savedSession.id;

        // Migrate messages
        if (session.messages && session.messages.length > 0) {
          for (const message of session.messages) {
            await ChatMessage.create({
              sessionId: sessionId,
              userId: userId,
              sender: message.type,
              messageType: message.messageType,
              content: message.content,
              imageUrl: message.imageUrl,
              createdAt: message.timestamp
            });
            migratedMessages++;
          }
        }

        migratedSessions++;
      }
    }

    // Migrate user statistics
    if (stats) {
      await UserStats.create({
        userId: userId,
        totalSessions: stats.totalSessions || 0,
        totalMessages: stats.totalMessages || 0,
        totalTextMessages: stats.totalTextMessages || 0,
        totalVoiceMessages: stats.totalVoiceMessages || 0,
        totalImageMessages: stats.totalImageMessages || 0
      });
    }

    // Update user preferences
    if (preferences) {
      await User.updateById(userId, {
        preferences: preferences,
        lastMigrated: new Date().toISOString()
      });
    }

    // Create migration record
    const migrationRecord = {
      userId: userId,
      guestId: guestId,
      migratedSessions: migratedSessions,
      migratedMessages: migratedMessages,
      migratedAt: new Date().toISOString(),
      status: 'completed'
    };

    await replitDB.create('guest_migration', replitDB.generateId(), migrationRecord);

    return NextResponse.json({
      success: true,
      message: 'Guest data migrated successfully',
      migratedSessions,
      migratedMessages,
      migrationId: migrationRecord.id
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error during migration' },
      { status: 500 }
    );
  }
}
