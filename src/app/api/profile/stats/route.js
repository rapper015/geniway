import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/database';
import { UserStats } from '../../../../../models/UserStats';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user statistics
    const userStats = await UserStats.findOne({ userId: decoded.userId });

    if (!userStats) {
      // Return default stats if no stats found
      return NextResponse.json({
        totalMessages: 0,
        totalSessions: 0,
        totalTextMessages: 0,
        totalVoiceMessages: 0,
        totalImageMessages: 0,
        totalTokensUsed: 0,
        lastActive: new Date()
      });
    }

    return NextResponse.json({
      totalMessages: userStats.totalMessages || 0,
      totalSessions: userStats.totalSessions || 0,
      totalTextMessages: userStats.totalTextMessages || 0,
      totalVoiceMessages: userStats.totalVoiceMessages || 0,
      totalImageMessages: userStats.totalImageMessages || 0,
      totalTokensUsed: userStats.totalTokensUsed || 0,
      lastActive: userStats.lastActive
    });

  } catch (error) {
    console.error('Profile stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
