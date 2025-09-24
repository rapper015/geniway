import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { User } from '../../../../../models/User';
import ChatSession from '../../../../../models/ChatSession';
import { ChatMessage } from '../../../../../models/ChatMessage';
import { UserStats } from '../../../../../models/UserStats';
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

    await connectDB();

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
        const sessionDoc = new ChatSession({
          userId: userId,
          subject: session.subject,
          title: session.title || 'Migrated Chat',
          messageCount: session.messageCount || 0,
          createdAt: new Date(session.createdAt),
          lastActive: new Date(session.lastActive || session.createdAt)
        });

        const savedSession = await sessionDoc.save();
        const sessionId = savedSession._id;

        // Migrate messages
        if (session.messages && session.messages.length > 0) {
          const messageDocs = session.messages.map(message => ({
            sessionId: sessionId,
            userId: userId,
            sender: message.type,
            messageType: message.messageType,
            content: message.content,
            imageUrl: message.imageUrl,
            createdAt: new Date(message.timestamp)
          }));

          await ChatMessage.insertMany(messageDocs);
          migratedMessages += messageDocs.length;
        }

        migratedSessions++;
      }
    }

    // Migrate user statistics
    if (stats) {
      const userStats = new UserStats({
        userId: userId,
        totalSessions: stats.totalSessions || 0,
        totalMessages: stats.totalMessages || 0,
        totalTextMessages: stats.totalTextMessages || 0,
        totalVoiceMessages: stats.totalVoiceMessages || 0,
        totalImageMessages: stats.totalImageMessages || 0
      });

      await userStats.save();
    }

    // Update user preferences
    if (preferences) {
      await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            preferences: preferences,
            lastMigrated: new Date()
          }
        }
      );
    }

    // Create migration record
    const migrationRecord = {
      userId: userId,
      guestId: guestId,
      migratedSessions: migratedSessions,
      migratedMessages: migratedMessages,
      migratedAt: new Date(),
      status: 'completed'
    };

    await db.collection('guest_migrations').insertOne(migrationRecord);

    return NextResponse.json({
      success: true,
      message: 'Guest data migrated successfully',
      migratedSessions,
      migratedMessages,
      migrationId: migrationRecord._id
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error during migration' },
      { status: 500 }
    );
  }
}
