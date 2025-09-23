import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
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
    console.log('[Profile Update] Received data:', profileData);

    await connectDB();

    // Build update object with all provided fields
    const updateFields = {
      updatedAt: new Date()
    };

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

    console.log('[Profile Update] Update fields:', updateFields);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return updated user data without password
    const userResponse = updatedUser.toJSON();

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
