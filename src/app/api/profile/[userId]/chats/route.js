import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../../lib/database';
import { User, ChatSession, ChatMessage } from '../../../../../../models';

// DELETE - Clear all chat history for a user
export async function DELETE(request, { params }) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    // Find user
    let user = await User.findById(userId);
    if (!user) {
      user = await User.findOne({ email: userId });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all sessions for this user
    const sessions = await ChatSession.find({ userId: userId.toString() });
    const sessionIds = sessions.map(session => session.id);

    // Delete all messages for these sessions
    const deleteMessagesResult = await ChatMessage.deleteMany({ 
      sessionId: { $in: sessionIds } 
    });

    // Delete all sessions for this user
    const deleteSessionsResult = await ChatSession.deleteMany({ 
      userId: userId.toString() 
    });

    return NextResponse.json({
      success: true,
      message: 'Chat history cleared successfully',
      deletedSessions: deleteSessionsResult.deletedCount,
      deletedMessages: deleteMessagesResult.deletedCount
    });

  } catch (error) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json(
      { error: 'Failed to clear chat history' },
      { status: 500 }
    );
  }
}
