import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/database';
import { User } from '../../../../../models/User';
import jwt from 'jsonwebtoken';

export async function PUT(request) {
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

    const profileData = await request.json();

    await connectDB();

    // Build update object with all provided fields
    const updateFields = {};

    // Map profile data to user fields
    if (profileData.firstName) updateFields.firstName = profileData.firstName.trim();
    if (profileData.lastName) updateFields.lastName = profileData.lastName.trim();
    if (profileData.firstName && profileData.lastName) {
      updateFields.name = `${profileData.firstName.trim()} ${profileData.lastName.trim()}`;
    }
    if (profileData.role) updateFields.role = profileData.role;
    if (profileData.grade) updateFields.grade = profileData.grade;
    if (profileData.board) updateFields.board = profileData.board;
    if (profileData.subjects) updateFields.subjects = profileData.subjects;
    if (profileData.learningStyle) updateFields.learningStyle = profileData.learningStyle;
    if (profileData.pace) updateFields.pace = profileData.pace;
    if (profileData.state) updateFields.state = profileData.state;
    if (profileData.city) updateFields.city = profileData.city;
    if (profileData.email) updateFields.email = profileData.email.toLowerCase();
    if (profileData.preferences) updateFields.preferences = profileData.preferences;


    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      updateFields
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return updated user data without password
    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      grade: updatedUser.grade,
      board: updatedUser.board,
      state: updatedUser.state,
      city: updatedUser.city,
      school: updatedUser.school,
      subjects: updatedUser.subjects,
      langPref: updatedUser.langPref,
      teachingLanguage: updatedUser.teachingLanguage,
      pace: updatedUser.pace,
      learningStyle: updatedUser.learningStyle,
      learningStyles: updatedUser.learningStyles,
      contentMode: updatedUser.contentMode,
      fastTrackEnabled: updatedUser.fastTrackEnabled,
      saveChatHistory: updatedUser.saveChatHistory,
      studyStreaksEnabled: updatedUser.studyStreaksEnabled,
      breakRemindersEnabled: updatedUser.breakRemindersEnabled,
      masteryNudgesEnabled: updatedUser.masteryNudgesEnabled,
      dataSharingEnabled: updatedUser.dataSharingEnabled,
      isGuest: updatedUser.isGuest,
      ageBand: updatedUser.ageBand,
      profileCompletionStep: updatedUser.profileCompletionStep,
      profileCompleted: updatedUser.profileCompleted,
      phoneNumber: updatedUser.phoneNumber,
      totalQuestionsAsked: updatedUser.totalQuestionsAsked,
      totalQuizzesCompleted: updatedUser.totalQuizzesCompleted,
      averageQuizScore: updatedUser.averageQuizScore,
      lastActiveSession: updatedUser.lastActiveSession,
      totalSessions: updatedUser.totalSessions,
      preferences: updatedUser.preferences,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH method - same as PUT for profile updates
export async function PATCH(request) {
  return PUT(request);
}
