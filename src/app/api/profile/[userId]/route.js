import { NextResponse } from 'next/server';
import { User } from '../../../../../models/User';

// GET - Load user profile
export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find user by ID or email
    let user = await User.findById(userId);
    if (!user) {
      // Try to find by email if ID doesn't work
      user = await User.findByEmail(userId);
    }

    // If user not found and it's a guest user, create a default profile
    if (!user && userId.startsWith('guest_')) {
      console.log('[Profile API] Creating default guest profile for:', userId);
      
      // Create a default guest user profile
      user = await User.create({
        name: 'Guest User',
        firstName: 'Guest',
        lastName: 'User',
        email: `${userId}@geniway.local`,
        role: 'student',
        grade: null,
        isGuest: true,
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
        ageBand: '11-14',
        profileCompletionStep: 0,
        profileCompleted: false,
        totalQuestionsAsked: 0,
        totalQuizzesCompleted: 0,
        averageQuizScore: 0,
        lastActiveSession: new Date().toISOString(),
        totalSessions: 0,
        preferences: {
          language: 'en',
          notifications: true
        }
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform user data to match frontend expectations
    const profile = {
      user_id: user.id,
      first_name: user.firstName || user.name?.split(' ')[0] || '',
      last_name: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      preferred_name: user.preferredName || '',
      whatsapp_number: user.whatsappNumber || '',
      state: user.state || '',
      city: user.city || '',
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
      data_sharing_enabled: user.dataSharingEnabled || false
    };

    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      age_band: user.ageBand || '11-14'
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

    // Find user by ID or email
    let user = await User.findById(userId);
    if (!user) {
      user = await User.findByEmail(userId);
    }

    // If user not found and it's a guest user, create a default profile
    if (!user && userId.startsWith('guest_')) {
      console.log('[Profile API] Creating default guest profile for PATCH:', userId);
      
      // Create a default guest user profile
      user = await User.create({
        name: 'Guest User',
        firstName: 'Guest',
        lastName: 'User',
        email: `${userId}@geniway.local`,
        role: 'student',
        grade: null,
        isGuest: true,
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
        ageBand: '11-14',
        profileCompletionStep: 0,
        profileCompleted: false,
        totalQuestionsAsked: 0,
        totalQuizzesCompleted: 0,
        averageQuizScore: 0,
        lastActiveSession: new Date().toISOString(),
        totalSessions: 0,
        preferences: {
          language: 'en',
          notifications: true
        }
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Map frontend field names to database field names
    const mappedUpdates = {};
    
    if (updateData.first_name !== undefined) mappedUpdates.firstName = updateData.first_name;
    if (updateData.last_name !== undefined) mappedUpdates.lastName = updateData.last_name;
    if (updateData.preferred_name !== undefined) mappedUpdates.preferredName = updateData.preferred_name;
    if (updateData.whatsapp_number !== undefined) mappedUpdates.whatsappNumber = updateData.whatsapp_number;
    if (updateData.state !== undefined) mappedUpdates.state = updateData.state;
    if (updateData.city !== undefined) mappedUpdates.city = updateData.city;
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
    
    // Handle email updates
    if (updateData.email !== undefined) {
      mappedUpdates.email = updateData.email.toLowerCase().trim();
    }

    // Update the user
    const updatedUser = await User.updateById(user.id, mappedUpdates);

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Return updated profile data
    const profile = {
      user_id: updatedUser.id,
      first_name: updatedUser.firstName || updatedUser.name?.split(' ')[0] || '',
      last_name: updatedUser.lastName || updatedUser.name?.split(' ').slice(1).join(' ') || '',
      preferred_name: updatedUser.preferredName || '',
      whatsapp_number: updatedUser.whatsappNumber || '',
      state: updatedUser.state || '',
      city: updatedUser.city || '',
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
      data_sharing_enabled: updatedUser.dataSharingEnabled || false
    };

    const userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      age_band: updatedUser.ageBand || '11-14'
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
