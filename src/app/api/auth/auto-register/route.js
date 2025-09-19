import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { User } from '../../../../../models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { 
      firstName, 
      lastName, 
      role, 
      grade, 
      board,
      subjects,
      learningStyle,
      learningStyles,
      pace,
      state,
      city,
      teachingLanguage,
      contentMode,
      fastTrackEnabled,
      saveChatHistory,
      studyStreaksEnabled,
      breakRemindersEnabled,
      masteryNudgesEnabled,
      dataSharingEnabled,
      isGuest = true 
    } = await request.json();

    if (!firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'First name, last name, and role are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Create a temporary email for guest users
    const tempEmail = `guest_${Date.now()}@geniway.local`;
    const fullName = `${firstName} ${lastName}`;

    // Create new user with comprehensive profile
    const user = new User({
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      email: tempEmail,
      role: role,
      grade: grade || null,
      isGuest: isGuest,
      board: board || 'CBSE',
      subjects: subjects || [],
      state: state || '',
      city: city || '',
      langPref: 'en',
      teachingLanguage: teachingLanguage || 'English',
      pace: pace || 'Normal',
      learningStyle: learningStyle || 'Text',
      learningStyles: learningStyles || ['Text'],
      contentMode: contentMode || 'step-by-step',
      fastTrackEnabled: fastTrackEnabled || false,
      saveChatHistory: saveChatHistory !== undefined ? saveChatHistory : true,
      studyStreaksEnabled: studyStreaksEnabled !== undefined ? studyStreaksEnabled : true,
      breakRemindersEnabled: breakRemindersEnabled !== undefined ? breakRemindersEnabled : true,
      masteryNudgesEnabled: masteryNudgesEnabled !== undefined ? masteryNudgesEnabled : true,
      dataSharingEnabled: dataSharingEnabled || false,
      ageBand: grade && grade <= 8 ? '6-10' : grade && grade <= 10 ? '11-14' : '15-18',
      // Profile completion tracking
      profileCompletionStep: 9, // Completed all 9 steps
      profileCompleted: true,
      // Learning analytics
      totalQuestionsAsked: 0,
      totalQuizzesCompleted: 0,
      averageQuizScore: 0,
      // Session information
      lastActiveSession: new Date(),
      totalSessions: 1,
      preferences: {
        language: 'en',
        notifications: true
      }
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        isGuest: user.isGuest 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    // Return user data without password
    const userResponse = user.toJSON();

    return NextResponse.json({
      success: true,
      user: userResponse,
      token: token,
      message: 'Account created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Auto-registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
