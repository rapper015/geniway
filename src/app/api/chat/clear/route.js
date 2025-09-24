import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/database';
import { ChatSession, ChatMessage } from '../../../../../models';
import { UserStats } from '../../../../../models';

export async function DELETE(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get all sessions for the user
    const sessions = await ChatSession.find({ userId });
    const sessionIds = sessions.map(session => session.id);

    // Delete all messages for these sessions
    const messageDeleteResult = await ChatMessage.deleteMany({
      sessionId: { $in: sessionIds }
    });

    // Delete all sessions
    const sessionDeleteResult = await ChatSession.deleteMany({ userId });

    // Reset user stats
    await UserStats.findOneAndUpdate(
      { userId },
      {
        $set: {
          totalSessions: 0,
          totalMessages: 0,
          totalTextMessages: 0,
          totalVoiceMessages: 0,
          totalImageMessages: 0,
          totalTokensUsed: 0,
          lastActive: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Chat history cleared successfully',
      deletedSessions: sessionDeleteResult.deletedCount,
      deletedMessages: messageDeleteResult.deletedCount
    });
  } catch (error) {
    console.error('Clear chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to clear chat history' },
      { status: 500 }
    );
  }
}
