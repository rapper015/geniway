import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/database';
import { User } from '../../../../../models/User';

// GET - Load user profile
export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    // Find user by ID or email
    let user = await User.findById(userId);
    if (!user) {
      // Try to find by email if ID doesn't work
      user = await User.findOne({ email: userId });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform user data to match frontend expectations
    const profile = {
      user_id: user.id.toString(),
      first_name: user.firstName || user.name?.split(' ')[0] || '',
      last_name: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      name: user.name || '',
      preferred_name: user.preferredName || '',
      whatsapp_number: user.whatsappNumber || '',
      phone_number: user.phoneNumber || '',
      state: user.state || '',
      city: user.city || '',
      school: user.school || '',
      board: user.board || 'CBSE',
      grade: user.grade || null,
      subjects: user.subjects || [],
      lang_pref: user.langPref || 'en',
      teaching_language: user.teachingLanguage || 'English',
      pace: user.pace || 'Normal',
      learning_style: user.learningStyle || 'Text',
      learning_styles: user.learningStyles || [user.learningStyle] || ['Text'],
      content_mode: user.contentMode || 'step-by-step',
      fast_track_enabled: user.fastTrackEnabled || false,
      save_chat_history: user.saveChatHistory !== false, // default to true
      study_streaks_enabled: user.studyStreaksEnabled !== false, // default to true
      break_reminders_enabled: user.breakRemindersEnabled !== false, // default to true
      mastery_nudges_enabled: user.masteryNudgesEnabled !== false, // default to true
      data_sharing_enabled: user.dataSharingEnabled || false,
      // Additional fields
      is_guest: user.isGuest || false,
      age_band: user.ageBand || '11-14',
      profile_completion_step: user.profileCompletionStep || 0,
      profile_completed: user.profileCompleted || false,
      total_questions_asked: user.totalQuestionsAsked || 0,
      total_quizzes_completed: user.totalQuizzesCompleted || 0,
      average_quiz_score: user.averageQuizScore || 0,
      last_active_session: user.lastActiveSession || new Date(),
      total_sessions: user.totalSessions || 0,
      preferences: user.preferences || { language: 'en', notifications: true },
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };

    const userData = {
      _id: user.id.toString(),
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      preferredName: user.preferredName,
      whatsappNumber: user.whatsappNumber,
      phoneNumber: user.phoneNumber,
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
      isGuest: user.isGuest || false,
      ageBand: user.ageBand || '11-14',
      profileCompletionStep: user.profileCompletionStep || 0,
      profileCompleted: user.profileCompleted || false,
      totalQuestionsAsked: user.totalQuestionsAsked || 0,
      totalQuizzesCompleted: user.totalQuizzesCompleted || 0,
      averageQuizScore: user.averageQuizScore || 0,
      lastActiveSession: user.lastActiveSession || new Date(),
      totalSessions: user.totalSessions || 0,
      preferences: user.preferences || { language: 'en', notifications: true },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json({
      success: true,
      profile,
      user: userData
    });

  } catch (error) {
    console.error('Error loading profile:', error);
    return NextResponse.json(
      { error: 'Failed to load profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update user profile
export async function PATCH(request, { params }) {
  try {
    const { userId } = await params;
    const updateData = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    // Find user by ID or email
    let user = await User.findById(userId);
    if (!user) {
      user = await User.findOne({ email: userId });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Map frontend field names to database field names
    const mappedUpdates = {};
    
    if (updateData.first_name !== undefined) mappedUpdates.firstName = updateData.first_name;
    if (updateData.last_name !== undefined) mappedUpdates.lastName = updateData.last_name;
    if (updateData.name !== undefined) mappedUpdates.name = updateData.name;
    if (updateData.preferred_name !== undefined) mappedUpdates.preferredName = updateData.preferred_name;
    if (updateData.whatsapp_number !== undefined) mappedUpdates.whatsappNumber = updateData.whatsapp_number;
    if (updateData.phone_number !== undefined) mappedUpdates.phoneNumber = updateData.phone_number;
    if (updateData.state !== undefined) mappedUpdates.state = updateData.state;
    if (updateData.city !== undefined) mappedUpdates.city = updateData.city;
    if (updateData.school !== undefined) mappedUpdates.school = updateData.school;
    if (updateData.board !== undefined) mappedUpdates.board = updateData.board;
    if (updateData.grade !== undefined) mappedUpdates.grade = updateData.grade;
    if (updateData.subjects !== undefined) mappedUpdates.subjects = updateData.subjects;
    if (updateData.lang_pref !== undefined) mappedUpdates.langPref = updateData.lang_pref;
    if (updateData.teaching_language !== undefined) mappedUpdates.teachingLanguage = updateData.teaching_language;
    if (updateData.pace !== undefined) mappedUpdates.pace = updateData.pace;
    if (updateData.learning_style !== undefined) mappedUpdates.learningStyle = updateData.learning_style;
    if (updateData.learning_styles !== undefined) mappedUpdates.learningStyles = updateData.learning_styles;
    if (updateData.content_mode !== undefined) mappedUpdates.contentMode = updateData.content_mode;
    if (updateData.fast_track_enabled !== undefined) mappedUpdates.fastTrackEnabled = updateData.fast_track_enabled;
    if (updateData.save_chat_history !== undefined) mappedUpdates.saveChatHistory = updateData.save_chat_history;
    if (updateData.study_streaks_enabled !== undefined) mappedUpdates.studyStreaksEnabled = updateData.study_streaks_enabled;
    if (updateData.break_reminders_enabled !== undefined) mappedUpdates.breakRemindersEnabled = updateData.break_reminders_enabled;
    if (updateData.mastery_nudges_enabled !== undefined) mappedUpdates.masteryNudgesEnabled = updateData.mastery_nudges_enabled;
    if (updateData.data_sharing_enabled !== undefined) mappedUpdates.dataSharingEnabled = updateData.data_sharing_enabled;
    if (updateData.is_guest !== undefined) mappedUpdates.isGuest = updateData.is_guest;
    if (updateData.age_band !== undefined) mappedUpdates.ageBand = updateData.age_band;
    if (updateData.profile_completion_step !== undefined) mappedUpdates.profileCompletionStep = updateData.profile_completion_step;
    if (updateData.profile_completed !== undefined) mappedUpdates.profileCompleted = updateData.profile_completed;
    if (updateData.preferences !== undefined) mappedUpdates.preferences = updateData.preferences;
    
    // Handle email updates
    if (updateData.email !== undefined) {
      mappedUpdates.email = updateData.email.toLowerCase().trim();
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      mappedUpdates
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Return updated profile data
    const profile = {
      user_id: updatedUser.id.toString(),
      first_name: updatedUser.firstName || updatedUser.name?.split(' ')[0] || '',
      last_name: updatedUser.lastName || updatedUser.name?.split(' ').slice(1).join(' ') || '',
      name: updatedUser.name || '',
      preferred_name: updatedUser.preferredName || '',
      whatsapp_number: updatedUser.whatsappNumber || '',
      phone_number: updatedUser.phoneNumber || '',
      state: updatedUser.state || '',
      city: updatedUser.city || '',
      school: updatedUser.school || '',
      board: updatedUser.board || 'CBSE',
      grade: updatedUser.grade || null,
      subjects: updatedUser.subjects || [],
      lang_pref: updatedUser.langPref || 'en',
      teaching_language: updatedUser.teachingLanguage || 'English',
      pace: updatedUser.pace || 'Normal',
      learning_style: updatedUser.learningStyle || 'Text',
      learning_styles: updatedUser.learningStyles || [updatedUser.learningStyle] || ['Text'],
      content_mode: updatedUser.contentMode || 'step-by-step',
      fast_track_enabled: updatedUser.fastTrackEnabled || false,
      save_chat_history: updatedUser.saveChatHistory !== false,
      study_streaks_enabled: updatedUser.studyStreaksEnabled !== false,
      break_reminders_enabled: updatedUser.breakRemindersEnabled !== false,
      mastery_nudges_enabled: updatedUser.masteryNudgesEnabled !== false,
      data_sharing_enabled: updatedUser.dataSharingEnabled || false,
      // Additional fields
      is_guest: updatedUser.isGuest || false,
      age_band: updatedUser.ageBand || '11-14',
      profile_completion_step: updatedUser.profileCompletionStep || 0,
      profile_completed: updatedUser.profileCompleted || false,
      total_questions_asked: updatedUser.totalQuestionsAsked || 0,
      total_quizzes_completed: updatedUser.totalQuizzesCompleted || 0,
      average_quiz_score: updatedUser.averageQuizScore || 0,
      last_active_session: updatedUser.lastActiveSession || new Date(),
      total_sessions: updatedUser.totalSessions || 0,
      preferences: updatedUser.preferences || { language: 'en', notifications: true },
      created_at: updatedUser.createdAt,
      updated_at: updatedUser.updatedAt
    };

    const userData = {
      _id: updatedUser.id.toString(),
      id: updatedUser.id.toString(),
      email: updatedUser.email,
      name: updatedUser.name,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      preferredName: updatedUser.preferredName,
      whatsappNumber: updatedUser.whatsappNumber,
      phoneNumber: updatedUser.phoneNumber,
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
      isGuest: updatedUser.isGuest || false,
      ageBand: updatedUser.ageBand || '11-14',
      profileCompletionStep: updatedUser.profileCompletionStep || 0,
      profileCompleted: updatedUser.profileCompleted || false,
      totalQuestionsAsked: updatedUser.totalQuestionsAsked || 0,
      totalQuizzesCompleted: updatedUser.totalQuizzesCompleted || 0,
      averageQuizScore: updatedUser.averageQuizScore || 0,
      lastActiveSession: updatedUser.lastActiveSession || new Date(),
      totalSessions: updatedUser.totalSessions || 0,
      preferences: updatedUser.preferences || { language: 'en', notifications: true },
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    return NextResponse.json({
      success: true,
      profile,
      user: userData
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
