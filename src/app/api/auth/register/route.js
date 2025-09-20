import { NextResponse } from 'next/server';
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

    // Check if user already exists
    const existingUser = await User.findByEmail(email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const result = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      role: role || 'student',
      grade,
      school
    });
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: result.id,
        email: result.email,
        role: result.role
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
