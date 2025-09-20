import { NextResponse } from 'next/server';
import ChatSession from '../../../../../models/ChatSession';
import { ChatMessage } from '../../../../../models/ChatMessage';
import { UserStats } from '../../../../../models/UserStats';

export async function DELETE(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all sessions for the user
    const sessions = await ChatSession.find({ userId });
    const sessionIds = sessions.map(session => session.id);

    let deletedMessages = 0;
    // Delete all messages for these sessions
    for (const sessionId of sessionIds) {
      const messages = await ChatMessage.findBySessionId(sessionId);
      for (const message of messages) {
        await ChatMessage.deleteById(message.id);
        deletedMessages++;
      }
    }

    let deletedSessions = 0;
    // Delete all sessions
    for (const session of sessions) {
      await ChatSession.deleteById(session.id);
      deletedSessions++;
    }

    // Reset user stats
    let userStats = await UserStats.findByUserId(userId);
    if (userStats) {
      await UserStats.updateById(userStats.id, {
        totalSessions: 0,
        totalMessages: 0,
        totalTextMessages: 0,
        totalVoiceMessages: 0,
        totalImageMessages: 0,
        totalTokensUsed: 0,
        lastActive: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Chat history cleared successfully',
      deletedSessions: deletedSessions,
      deletedMessages: deletedMessages
    });
  } catch (error) {
    console.error('Clear chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to clear chat history' },
      { status: 500 }
    );
  }
}
