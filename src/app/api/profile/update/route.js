import { NextResponse } from 'next/server';
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

    const { name, grade, school, role } = await request.json();

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (role === 'student' && !grade) {
      return NextResponse.json(
        { error: 'Grade is required for students' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await User.updateById(decoded.userId, {
      name: name.trim(),
      grade: role === 'student' ? grade : null,
      school: school?.trim() || null,
      role: role || 'student'
    });

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
