import { NextResponse } from 'next/server';
import { User } from '../../../../../../models/User';
import ChatSession from '../../../../../../models/ChatSession';
import { ChatMessage } from '../../../../../../models/ChatMessage';

// POST - Export user data
export async function POST(request, { params }) {
  try {
    const { userId } = await params;
    const { format } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!format || !['pdf', 'email'].includes(format)) {
      return NextResponse.json({ error: 'Format must be pdf or email' }, { status: 400 });
    }

    // Find user
    let user = await User.findById(userId);
    if (!user) {
      user = await User.findByEmail(userId);
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's chat sessions and messages
    const sessions = await ChatSession.find({ userId: userId });
    const sessionIds = sessions.map(session => session.id);
    
    // Get messages for all sessions
    let allMessages = [];
    for (const sessionId of sessionIds) {
      const sessionMessages = await ChatMessage.findBySessionId(sessionId);
      allMessages = allMessages.concat(sessionMessages);
    }
    
    // Sort messages by timestamp
    allMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

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
        id: session.id,
        subject: session.subject,
        title: session.title,
        messageCount: session.messageCount,
        createdAt: session.createdAt,
        lastActive: session.lastActive
      })),
      messages: allMessages.map(message => ({
        sessionId: message.sessionId,
        sender: message.sender,
        content: message.content,
        messageType: message.messageType,
        timestamp: message.createdAt
      })),
      exportDate: new Date().toISOString(),
      totalSessions: sessions.length,
      totalMessages: allMessages.length
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
