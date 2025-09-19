import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { User } from '../../../../../models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { firstName, lastName, role, grade, isGuest = true } = await request.json();

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
      board: 'CBSE',
      langPref: 'en',
      teachingLanguage: 'English',
      pace: 'Normal',
      learningStyle: 'Text',
      learningStyles: ['Text'],
      contentMode: 'step-by-step',
      fastTrackEnabled: false,
      saveChatHistory: true,
      studyStreaksEnabled: true,
      breakRemindersEnabled: true,
      masteryNudgesEnabled: true,
      dataSharingEnabled: false,
      ageBand: grade && grade <= 8 ? '6-10' : grade && grade <= 10 ? '11-14' : '15-18',
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
