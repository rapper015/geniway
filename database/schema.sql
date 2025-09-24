-- PostgreSQL Database Schema for Geniway
-- Run this script to create all necessary tables

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    preferred_name VARCHAR(100),
    whatsapp_number VARCHAR(20),
    role VARCHAR(50) DEFAULT 'student',
    grade INTEGER,
    board VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    school VARCHAR(255),
    subjects JSONB DEFAULT '[]',
    lang_pref VARCHAR(10) DEFAULT 'en',
    teaching_language VARCHAR(50) DEFAULT 'English',
    pace VARCHAR(50) DEFAULT 'Normal',
    learning_style VARCHAR(50),
    learning_styles JSONB DEFAULT '[]',
    content_mode VARCHAR(50) DEFAULT 'step-by-step',
    fast_track_enabled BOOLEAN DEFAULT false,
    save_chat_history BOOLEAN DEFAULT true,
    study_streaks_enabled BOOLEAN DEFAULT true,
    break_reminders_enabled BOOLEAN DEFAULT true,
    mastery_nudges_enabled BOOLEAN DEFAULT true,
    data_sharing_enabled BOOLEAN DEFAULT false,
    is_guest BOOLEAN DEFAULT false,
    age_band VARCHAR(20),
    profile_completion_step INTEGER DEFAULT 0,
    profile_completed BOOLEAN DEFAULT false,
    phone_number VARCHAR(20),
    total_questions_asked INTEGER DEFAULT 0,
    total_quizzes_completed INTEGER DEFAULT 0,
    average_quiz_score DECIMAL(5,2) DEFAULT 0,
    last_active_session TIMESTAMP,
    total_sessions INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255),
    subject VARCHAR(100) NOT NULL DEFAULT 'general',
    mode VARCHAR(50) DEFAULT 'step-by-step',
    title VARCHAR(255) DEFAULT 'New Chat',
    message_count INTEGER DEFAULT 0,
    last_active TIMESTAMP DEFAULT NOW(),
    is_guest BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active',
    messages JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    sender VARCHAR(50) NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    content TEXT,
    image_url VARCHAR(500),
    tokens_used INTEGER,
    model VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Stats table
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    total_messages INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_questions_asked INTEGER DEFAULT 0,
    total_quizzes_completed INTEGER DEFAULT 0,
    average_quiz_score DECIMAL(5,2) DEFAULT 0,
    total_study_time INTEGER DEFAULT 0,
    last_active TIMESTAMP DEFAULT NOW(),
    streak_count INTEGER DEFAULT 0,
    last_streak_date DATE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_guest ON users(is_guest);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_active ON chat_sessions(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_status ON chat_sessions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_active ON user_stats(last_active);

-- Create triggers to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

