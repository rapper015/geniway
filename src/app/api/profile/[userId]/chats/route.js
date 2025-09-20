import { NextResponse } from 'next/server';
import { User } from '../../../../../../models/User';
import ChatSession from '../../../../../../models/ChatSession';
import { ChatMessage } from '../../../../../../models/ChatMessage';

// DELETE - Clear all chat history for a user
export async function DELETE(request, { params }) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find user
    let user = await User.findById(userId);
    if (!user) {
      user = await User.findByEmail(userId);
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all sessions for this user
    const sessions = await ChatSession.find({ userId: userId });
    const sessionIds = sessions.map(session => session.id);

    // Delete all messages for these sessions
    let deletedMessagesCount = 0;
    for (const sessionId of sessionIds) {
      const messages = await ChatMessage.findBySessionId(sessionId);
      for (const message of messages) {
        await ChatMessage.deleteById(message.id);
        deletedMessagesCount++;
      }
    }

    // Delete all sessions for this user
    let deletedSessionsCount = 0;
    for (const session of sessions) {
      await ChatSession.deleteById(session.id);
      deletedSessionsCount++;
    }

    return NextResponse.json({
      success: true,
      message: 'Chat history cleared successfully',
      deletedSessions: deletedSessionsCount,
      deletedMessages: deletedMessagesCount
    });

  } catch (error) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json(
      { error: 'Failed to clear chat history' },
      { status: 500 }
    );
  }
}
