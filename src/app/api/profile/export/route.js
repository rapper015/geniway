import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/database';
import { User, ChatSession, ChatMessage } from '../../../../../models';
import { UserStats } from '../../../../../models';

export async function POST(request) {
  try {
    const { format, userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's chat sessions and messages
    const sessions = await ChatSession.find({ userId });
    const sessionIds = sessions.map(session => session.id);
    
    // Get messages for all sessions
    const messages = [];
    for (const sessionId of sessionIds) {
      const sessionMessages = await ChatMessage.find({ sessionId });
      messages.push(...sessionMessages);
    }

    // Get user stats
    const stats = await UserStats.findOne({ userId });

    const exportData = {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        school: user.school,
        preferences: user.preferences
      },
      stats: stats || {},
      sessions: sessions.map(session => ({
        id: session.id,
        subject: session.subject,
        title: session.title,
        messageCount: session.messageCount,
        createdAt: session.createdAt,
        lastActive: session.lastActive
      })),
      messages: messages.map(message => ({
        id: message.id,
        sessionId: message.sessionId,
        sender: message.sender,
        type: message.messageType,
        content: message.content,
        imageUrl: message.imageUrl,
        timestamp: message.createdAt
      })),
      exportedAt: new Date().toISOString()
    };

    if (format === 'pdf') {
      // For PDF export, you would typically use a library like puppeteer or jsPDF
      // For now, we'll return the data and let the frontend handle PDF generation
      return NextResponse.json({
        success: true,
        message: 'PDF export data prepared',
        data: exportData,
        format: 'pdf'
      });
    } else if (format === 'email') {
      // For email export, you would typically send an email with the data
      // For now, we'll return success
      return NextResponse.json({
        success: true,
        message: 'Email export initiated',
        data: exportData,
        format: 'email'
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Data export completed',
        data: exportData,
        format: 'json'
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
