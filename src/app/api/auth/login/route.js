import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/database';
import { User } from '../../../../../models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Validate password
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id.toString(),
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      grade: user.grade,
      board: user.board,
      state: user.state,
      city: user.city,
      school: user.school,
      subjects: user.subjects,
      langPref: user.langPref,
      teachingLanguage: user.teachingLanguage,
      pace: user.pace,
      learningStyle: user.learningStyle,
      learningStyles: user.learningStyles,
      contentMode: user.contentMode,
      fastTrackEnabled: user.fastTrackEnabled,
      saveChatHistory: user.saveChatHistory,
      studyStreaksEnabled: user.studyStreaksEnabled,
      breakRemindersEnabled: user.breakRemindersEnabled,
      masteryNudgesEnabled: user.masteryNudgesEnabled,
      dataSharingEnabled: user.dataSharingEnabled,
      isGuest: user.isGuest,
      ageBand: user.ageBand,
      profileCompletionStep: user.profileCompletionStep,
      profileCompleted: user.profileCompleted,
      phoneNumber: user.phoneNumber,
      totalQuestionsAsked: user.totalQuestionsAsked,
      totalQuizzesCompleted: user.totalQuizzesCompleted,
      averageQuizScore: user.averageQuizScore,
      lastActiveSession: user.lastActiveSession,
      totalSessions: user.totalSessions,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json(
      { 
        message: 'Login successful',
        user: userResponse,
        token 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
