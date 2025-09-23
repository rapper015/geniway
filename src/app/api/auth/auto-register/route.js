import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { User } from '../../../../../models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { 
      firstName, 
      lastName, 
      email,
      password,
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

    // For real accounts (not guest), email and password are required
    if (!isGuest && (!email || !password)) {
      return NextResponse.json(
        { error: 'Email and password are required for account creation' },
        { status: 400 }
      );
    }

    await connectDB();

    // Convert grade to number if it's a string
    const convertGradeToNumber = (gradeValue) => {
      if (!gradeValue) return null;
      if (typeof gradeValue === 'number') return gradeValue;
      if (typeof gradeValue === 'string') {
        // Handle formats like "Class 8", "8", "Grade 8", etc.
        const match = gradeValue.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      }
      return null;
    };

    const numericGrade = convertGradeToNumber(grade);

    // Use provided email or create a temporary email for guest users
    const userEmail = email || `guest_${Date.now()}@geniway.local`;
    const fullName = `${firstName} ${lastName}`;

    // Create new user with comprehensive profile
    const user = new User({
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      email: userEmail,
      password: password || undefined, // Only set password if provided
      role: role,
      grade: numericGrade,
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
      ageBand: numericGrade && numericGrade <= 8 ? '6-10' : numericGrade && numericGrade <= 10 ? '11-14' : '15-18',
      // Profile completion tracking
      profileCompletionStep: 9, // Completed all steps (max allowed is 9)
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
