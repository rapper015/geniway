import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/database';
import { User } from '../../../../../models/User';

// POST - Sync all localStorage guest data with database
export async function POST(request) {
  try {
    const { guestId, localStorageData } = await request.json();

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the guest user - try both by ID and by originalGuestId
    const { query } = await import('../../../../../lib/database');
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

    // Build comprehensive update object from localStorage data
    const updateFields = {};

    // Map localStorage data to database fields
    if (localStorageData.firstName) updateFields.firstName = localStorageData.firstName.trim();
    if (localStorageData.lastName) updateFields.lastName = localStorageData.lastName.trim();
    if (localStorageData.name) updateFields.name = localStorageData.name.trim();
    if (localStorageData.email) updateFields.email = localStorageData.email.toLowerCase().trim();
    if (localStorageData.role) updateFields.role = localStorageData.role;
    if (localStorageData.grade) updateFields.grade = localStorageData.grade;
    if (localStorageData.board) updateFields.board = localStorageData.board;
    if (localStorageData.subjects) updateFields.subjects = localStorageData.subjects;
    if (localStorageData.learningStyle) updateFields.learningStyle = localStorageData.learningStyle;
    if (localStorageData.learningStyles) updateFields.learningStyles = localStorageData.learningStyles;
    if (localStorageData.pace) updateFields.pace = localStorageData.pace;
    if (localStorageData.contentMode) updateFields.contentMode = localStorageData.contentMode;
    if (localStorageData.state) updateFields.state = localStorageData.state;
    if (localStorageData.city) updateFields.city = localStorageData.city;
    if (localStorageData.school) updateFields.school = localStorageData.school;
    if (localStorageData.preferences) updateFields.preferences = localStorageData.preferences;
    if (localStorageData.profileCompletionStep !== undefined) updateFields.profileCompletionStep = localStorageData.profileCompletionStep;
    if (localStorageData.profileCompleted !== undefined) updateFields.profileCompleted = localStorageData.profileCompleted;
    if (localStorageData.fastTrackEnabled !== undefined) updateFields.fastTrackEnabled = localStorageData.fastTrackEnabled;
    if (localStorageData.saveChatHistory !== undefined) updateFields.saveChatHistory = localStorageData.saveChatHistory;
    if (localStorageData.studyStreaksEnabled !== undefined) updateFields.studyStreaksEnabled = localStorageData.studyStreaksEnabled;
    if (localStorageData.breakRemindersEnabled !== undefined) updateFields.breakRemindersEnabled = localStorageData.breakRemindersEnabled;
    if (localStorageData.masteryNudgesEnabled !== undefined) updateFields.masteryNudgesEnabled = localStorageData.masteryNudgesEnabled;
    if (localStorageData.dataSharingEnabled !== undefined) updateFields.dataSharingEnabled = localStorageData.dataSharingEnabled;
    if (localStorageData.ageBand) updateFields.ageBand = localStorageData.ageBand;
    if (localStorageData.teachingLanguage) updateFields.teachingLanguage = localStorageData.teachingLanguage;
    if (localStorageData.langPref) updateFields.langPref = localStorageData.langPref;

    // Update last seen timestamp
    updateFields.lastActiveSession = new Date();

    // Update the guest
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
      message: 'Guest data synced successfully',
      syncedFields: Object.keys(updateFields)
    });

  } catch (error) {
    console.error('Guest sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync guest data' },
      { status: 500 }
    );
  }
}
