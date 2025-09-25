import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/database';
import { User } from '../../../../models/User';
import { v4 as uuidv4 } from 'uuid';

// POST - Create a new guest user
export async function POST(request) {
  try {
    const { guestId, userAgent, timestamp } = await request.json();

    await connectDB();

    // Check if guest already exists - try both by ID and by originalGuestId
    const { query } = await import('../../../../lib/database');
    let existingGuestResult = await query(
      'SELECT * FROM users WHERE is_guest = true AND id = $1',
      [guestId]
    );
    
    if (existingGuestResult.rows.length === 0) {
      // Try by originalGuestId in guestMetadata
      existingGuestResult = await query(
        'SELECT * FROM users WHERE is_guest = true AND guest_metadata->>\'originalGuestId\' = $1',
        [guestId]
      );
    }
    
    const existingGuest = existingGuestResult.rows[0] ? new User(existingGuestResult.rows[0]) : null;

    if (existingGuest) {
      return NextResponse.json({
        success: true,
        guest: existingGuest,
        message: 'Guest already exists'
      });
    }

    // Create new guest user (don't set id - let database generate UUID)
    const guestData = new User({
      // id: not set - database will generate UUID
      email: `guest_${guestId}@temp.com`,
      password: null, // No password for guests
      name: 'Guest User',
      firstName: 'Guest',
      lastName: 'User',
      role: 'guest',
      grade: null,
      board: 'CBSE',
      subjects: [],
      state: '',
      city: '',
      school: '',
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
      isGuest: true,
      ageBand: '15-18',
      profileCompletionStep: 0,
      profileCompleted: false,
      totalQuestionsAsked: 0,
      totalQuizzesCompleted: 0,
      averageQuizScore: 0,
      lastActiveSession: new Date(),
      totalSessions: 0,
      preferences: {
        language: 'en',
        notifications: true
      },
      // Guest-specific metadata
      guestMetadata: {
        originalGuestId: guestId,
        userAgent: userAgent || '',
        createdAt: timestamp || new Date(),
        lastSeen: new Date()
      }
    });

    const savedGuest = await guestData.save();

    // Return guest data without sensitive fields
    const guestResponse = {
      id: savedGuest.id,
      email: savedGuest.email,
      name: savedGuest.name,
      firstName: savedGuest.firstName,
      lastName: savedGuest.lastName,
      role: savedGuest.role,
      grade: savedGuest.grade,
      board: savedGuest.board,
      subjects: savedGuest.subjects,
      state: savedGuest.state,
      city: savedGuest.city,
      school: savedGuest.school,
      langPref: savedGuest.langPref,
      teachingLanguage: savedGuest.teachingLanguage,
      pace: savedGuest.pace,
      learningStyle: savedGuest.learningStyle,
      learningStyles: savedGuest.learningStyles,
      contentMode: savedGuest.contentMode,
      fastTrackEnabled: savedGuest.fastTrackEnabled,
      saveChatHistory: savedGuest.saveChatHistory,
      studyStreaksEnabled: savedGuest.studyStreaksEnabled,
      breakRemindersEnabled: savedGuest.breakRemindersEnabled,
      masteryNudgesEnabled: savedGuest.masteryNudgesEnabled,
      dataSharingEnabled: savedGuest.dataSharingEnabled,
      isGuest: savedGuest.isGuest,
      ageBand: savedGuest.ageBand,
      profileCompletionStep: savedGuest.profileCompletionStep,
      profileCompleted: savedGuest.profileCompleted,
      totalQuestionsAsked: savedGuest.totalQuestionsAsked,
      totalQuizzesCompleted: savedGuest.totalQuizzesCompleted,
      averageQuizScore: savedGuest.averageQuizScore,
      lastActiveSession: savedGuest.lastActiveSession,
      totalSessions: savedGuest.totalSessions,
      preferences: savedGuest.preferences,
      createdAt: savedGuest.createdAt,
      updatedAt: savedGuest.updatedAt
    };

    return NextResponse.json({
      success: true,
      guest: guestResponse,
      message: 'Guest created successfully'
    });

  } catch (error) {
    console.error('Guest creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create guest user' },
      { status: 500 }
    );
  }
}

// PATCH - Update guest user data (no authentication required)
export async function PATCH(request) {
  try {
    const { guestId, updateData } = await request.json();

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the guest user - try both by ID and by originalGuestId
    const { query } = await import('../../../../lib/database');
    let guestResult = await query(
      'SELECT * FROM users WHERE is_guest = true AND id = $1',
      [guestId]
    );
    
    if (guestResult.rows.length === 0) {
      // Try by originalGuestId in guestMetadata
      guestResult = await query(
        'SELECT * FROM users WHERE is_guest = true AND guest_metadata->>\'originalGuestId\' = $1',
        [guestId]
      );
    }
    
    const guest = guestResult.rows[0] ? new User(guestResult.rows[0]) : null;

    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateFields = {};

    // Map update data to user fields
    if (updateData.firstName) updateFields.firstName = updateData.firstName.trim();
    if (updateData.lastName) updateFields.lastName = updateData.lastName.trim();
    if (updateData.firstName && updateData.lastName) {
      updateFields.name = `${updateData.firstName.trim()} ${updateData.lastName.trim()}`;
    }
    if (updateData.grade) updateFields.grade = updateData.grade;
    if (updateData.board) updateFields.board = updateData.board;
    if (updateData.subjects) updateFields.subjects = updateData.subjects;
    if (updateData.learningStyle) updateFields.learningStyle = updateData.learningStyle;
    if (updateData.learningStyles) updateFields.learningStyles = updateData.learningStyles;
    if (updateData.pace) updateFields.pace = updateData.pace;
    if (updateData.contentMode) updateFields.contentMode = updateData.contentMode;
    if (updateData.state) updateFields.state = updateData.state;
    if (updateData.city) updateFields.city = updateData.city;
    if (updateData.school) updateFields.school = updateData.school;
    if (updateData.preferences) updateFields.preferences = updateData.preferences;
    if (updateData.profileCompletionStep !== undefined) updateFields.profileCompletionStep = updateData.profileCompletionStep;
    if (updateData.profileCompleted !== undefined) updateFields.profileCompleted = updateData.profileCompleted;

    // Update last seen timestamp
    updateFields.lastActiveSession = new Date();

    // Update the guest using the database ID
    const updatedGuest = await User.findByIdAndUpdate(guest.id, updateFields);

    if (!updatedGuest) {
      return NextResponse.json(
        { error: 'Failed to update guest' },
        { status: 500 }
      );
    }

    // Return updated guest data
    const guestResponse = {
      id: updatedGuest.id,
      email: updatedGuest.email,
      name: updatedGuest.name,
      firstName: updatedGuest.firstName,
      lastName: updatedGuest.lastName,
      role: updatedGuest.role,
      grade: updatedGuest.grade,
      board: updatedGuest.board,
      subjects: updatedGuest.subjects,
      state: updatedGuest.state,
      city: updatedGuest.city,
      school: updatedGuest.school,
      langPref: updatedGuest.langPref,
      teachingLanguage: updatedGuest.teachingLanguage,
      pace: updatedGuest.pace,
      learningStyle: updatedGuest.learningStyle,
      learningStyles: updatedGuest.learningStyles,
      contentMode: updatedGuest.contentMode,
      fastTrackEnabled: updatedGuest.fastTrackEnabled,
      saveChatHistory: updatedGuest.saveChatHistory,
      studyStreaksEnabled: updatedGuest.studyStreaksEnabled,
      breakRemindersEnabled: updatedGuest.breakRemindersEnabled,
      masteryNudgesEnabled: updatedGuest.masteryNudgesEnabled,
      dataSharingEnabled: updatedGuest.dataSharingEnabled,
      isGuest: updatedGuest.isGuest,
      ageBand: updatedGuest.ageBand,
      profileCompletionStep: updatedGuest.profileCompletionStep,
      profileCompleted: updatedGuest.profileCompleted,
      totalQuestionsAsked: updatedGuest.totalQuestionsAsked,
      totalQuizzesCompleted: updatedGuest.totalQuizzesCompleted,
      averageQuizScore: updatedGuest.averageQuizScore,
      lastActiveSession: updatedGuest.lastActiveSession,
      totalSessions: updatedGuest.totalSessions,
      preferences: updatedGuest.preferences,
      createdAt: updatedGuest.createdAt,
      updatedAt: updatedGuest.updatedAt
    };

    return NextResponse.json({
      success: true,
      guest: guestResponse,
      message: 'Guest updated successfully'
    });

  } catch (error) {
    console.error('Guest update error:', error);
    return NextResponse.json(
      { error: 'Failed to update guest' },
      { status: 500 }
    );
  }
}

// GET - Get guest user data (no authentication required)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const { query } = await import('../../../../lib/database');
    let guestResult = await query(
      'SELECT * FROM users WHERE is_guest = true AND id = $1',
      [guestId]
    );
    
    if (guestResult.rows.length === 0) {
      // Try by originalGuestId in guestMetadata
      guestResult = await query(
        'SELECT * FROM users WHERE is_guest = true AND guest_metadata->>\'originalGuestId\' = $1',
        [guestId]
      );
    }
    
    const guest = guestResult.rows[0] ? new User(guestResult.rows[0]) : null;

    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }

    // Return guest data
    const guestResponse = {
      id: guest.id,
      email: guest.email,
      name: guest.name,
      firstName: guest.firstName,
      lastName: guest.lastName,
      role: guest.role,
      grade: guest.grade,
      board: guest.board,
      subjects: guest.subjects,
      state: guest.state,
      city: guest.city,
      school: guest.school,
      langPref: guest.langPref,
      teachingLanguage: guest.teachingLanguage,
      pace: guest.pace,
      learningStyle: guest.learningStyle,
      learningStyles: guest.learningStyles,
      contentMode: guest.contentMode,
      fastTrackEnabled: guest.fastTrackEnabled,
      saveChatHistory: guest.saveChatHistory,
      studyStreaksEnabled: guest.studyStreaksEnabled,
      breakRemindersEnabled: guest.breakRemindersEnabled,
      masteryNudgesEnabled: guest.masteryNudgesEnabled,
      dataSharingEnabled: guest.dataSharingEnabled,
      isGuest: guest.isGuest,
      ageBand: guest.ageBand,
      profileCompletionStep: guest.profileCompletionStep,
      profileCompleted: guest.profileCompleted,
      totalQuestionsAsked: guest.totalQuestionsAsked,
      totalQuizzesCompleted: guest.totalQuizzesCompleted,
      averageQuizScore: guest.averageQuizScore,
      lastActiveSession: guest.lastActiveSession,
      totalSessions: guest.totalSessions,
      preferences: guest.preferences,
      createdAt: guest.createdAt,
      updatedAt: guest.updatedAt
    };

    return NextResponse.json({
      success: true,
      guest: guestResponse
    });

  } catch (error) {
    console.error('Guest fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guest' },
      { status: 500 }
    );
  }
}
