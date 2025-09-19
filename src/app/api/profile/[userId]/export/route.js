import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../../lib/mongodb';
import { User } from '../../../../../../models/User';
import ChatSession from '../../../../../../models/ChatSession';
import { ChatMessage } from '../../../../../../models/ChatMessage';

// POST - Export user data
export async function POST(request, { params }) {
  try {
    const { userId } = params;
    const { format } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!format || !['pdf', 'email'].includes(format)) {
      return NextResponse.json({ error: 'Format must be pdf or email' }, { status: 400 });
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

    // Get user's chat sessions and messages
    const sessions = await ChatSession.find({ userId: userId.toString() }).sort({ createdAt: -1 });
    const sessionIds = sessions.map(session => session._id);
    const messages = await ChatMessage.find({ sessionId: { $in: sessionIds } }).sort({ timestamp: 1 });

    // Prepare export data
    const exportData = {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        board: user.board,
        subjects: user.subjects,
        createdAt: user.createdAt
      },
      sessions: sessions.map(session => ({
        id: session._id,
        subject: session.subject,
        title: session.title,
        messageCount: session.messageCount,
        createdAt: session.createdAt,
        lastActive: session.lastActive
      })),
      messages: messages.map(message => ({
        sessionId: message.sessionId,
        sender: message.sender,
        content: message.content,
        messageType: message.messageType,
        timestamp: message.timestamp
      })),
      exportDate: new Date().toISOString(),
      totalSessions: sessions.length,
      totalMessages: messages.length
    };

    if (format === 'pdf') {
      // For PDF export, we would typically generate a PDF here
      // For now, return the data that would be used to generate PDF
      return NextResponse.json({
        success: true,
        message: 'PDF export initiated',
        data: exportData,
        downloadUrl: `/api/profile/${userId}/download/pdf` // This would be a separate endpoint
      });
    } else if (format === 'email') {
      // For email export, we would typically send an email here
      // For now, return success
      return NextResponse.json({
        success: true,
        message: 'Email export initiated',
        data: exportData
      });
    }

  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
