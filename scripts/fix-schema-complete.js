const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = require('pg');

const POSTGRESQL_URI = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;

if (!POSTGRESQL_URI) {
  console.log('❌ POSTGRESQL_URI or DATABASE_URL not found in .env!');
  process.exit(1);
}

async function fixSchemaComplete() {
  const pool = new Pool({
    connectionString: POSTGRESQL_URI,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    console.log('🔌 Connected to PostgreSQL');

    // Enable UUID extension
    console.log('📋 Ensuring UUID extension is enabled...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled');

    // Drop and recreate tables with proper schema
    console.log('🔧 Recreating tables with proper UUID schema...');
    
    // Drop foreign key constraints first
    console.log('🗑️  Dropping foreign key constraints...');
    try {
      await client.query('ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey');
      console.log('✅ Dropped chat_messages foreign key');
    } catch (e) {
      console.log('ℹ️  No chat_messages foreign key to drop');
    }

    // Drop tables in reverse dependency order
    console.log('🗑️  Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS chat_messages CASCADE');
    await client.query('DROP TABLE IF EXISTS chat_sessions CASCADE');
    await client.query('DROP TABLE IF EXISTS user_stats CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('✅ Dropped all existing tables');

    // Recreate tables with proper schema
    console.log('🏗️  Creating tables with proper UUID schema...');
    
    // Users table
    await client.query(`
      CREATE TABLE users (
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
      )
    `);
    console.log('✅ Created users table');

    // Chat Sessions table
    await client.query(`
      CREATE TABLE chat_sessions (
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
      )
    `);
    console.log('✅ Created chat_sessions table');

    // Chat Messages table
    await client.query(`
      CREATE TABLE chat_messages (
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
      )
    `);
    console.log('✅ Created chat_messages table');

    // User Stats table
    await client.query(`
      CREATE TABLE user_stats (
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
      )
    `);
    console.log('✅ Created user_stats table');

    // Create indexes
    console.log('📊 Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_is_guest ON users(is_guest)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_active ON chat_sessions(last_active DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_status ON chat_sessions(user_id, status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_stats_last_active ON user_stats(last_active)');
    console.log('✅ Created all indexes');

    // Create triggers for updated_at
    console.log('⚡ Creating triggers...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    await client.query('CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
    await client.query('CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
    await client.query('CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
    console.log('✅ Created all triggers');

    // Test the fix
    console.log('🧪 Testing session insertion...');
    const testSession = await client.query(`
      INSERT INTO chat_sessions (user_id, subject, mode, title, message_count, last_active, is_guest, status, messages, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, user_id, subject
    `, [
      'test_user',
      'mathematics',
      'step-by-step',
      'Test Chat',
      0,
      new Date(),
      true,
      'active',
      [],
      {}
    ]);
    
    console.log('✅ Session insertion successful:', testSession.rows[0]);
    
    // Test message insertion
    console.log('🧪 Testing message insertion...');
    const testMessage = await client.query(`
      INSERT INTO chat_messages (session_id, user_id, sender, message_type, content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, session_id, sender, content
    `, [
      testSession.rows[0].id,
      'test_user',
      'user',
      'text',
      'Hello, this is a test message!'
    ]);
    
    console.log('✅ Message insertion successful:', testMessage.rows[0]);
    
    // Clean up test data
    await client.query('DELETE FROM chat_messages WHERE session_id = $1', [testSession.rows[0].id]);
    await client.query('DELETE FROM chat_sessions WHERE user_id = $1', ['test_user']);
    console.log('🧹 Test data cleaned up');

    client.release();
    await pool.end();
    
    console.log('\n🎉 Complete schema fix completed successfully!');
    console.log('Your application should now work properly with PostgreSQL.');
    console.log('All tables have been recreated with proper UUID primary keys.');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

fixSchemaComplete();
