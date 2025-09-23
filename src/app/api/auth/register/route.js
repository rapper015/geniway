import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import { User } from '../../../../../models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password, name, role, grade, school } = await request.json();

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (role === 'student' && !grade) {
      return NextResponse.json(
        { error: 'Grade is required for students' },
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user with comprehensive profile data
    const userData = new User({
      email: email.toLowerCase(),
      password,
      name,
      firstName: name.split(' ')[0] || '',
      lastName: name.split(' ').slice(1).join(' ') || '',
      role: role || 'student',
      grade: numericGrade,
      school,
      // Default profile settings
      board: 'CBSE',
      subjects: [],
      state: '',
      city: '',
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
      ageBand: numericGrade && numericGrade <= 8 ? '6-10' : numericGrade && numericGrade <= 10 ? '11-14' : '15-18',
      // Profile completion tracking
      profileCompletionStep: 3, // Basic profile completed
      profileCompleted: false,
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

    // Save user to database (password will be hashed automatically by pre-save hook)
    const result = await userData.save();
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: result._id.toString(),
        email: userData.email,
        role: userData.role
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userResponse = result.toJSON();
    delete userResponse.password;

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userResponse,
        token 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
