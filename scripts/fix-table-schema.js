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

async function fixTableSchema() {
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

    // Fix chat_sessions table
    console.log('🔧 Fixing chat_sessions table...');
    
    // First, let's see what we have
    const currentSchema = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'chat_sessions' AND column_name = 'id'
    `);
    
    console.log('Current id column:', currentSchema.rows[0]);
    
    if (currentSchema.rows[0].data_type === 'character varying') {
      console.log('⚠️  ID column is VARCHAR, converting to UUID...');
      
      // Add a new UUID column
      await client.query('ALTER TABLE chat_sessions ADD COLUMN new_id UUID DEFAULT uuid_generate_v4()');
      console.log('✅ Added new UUID column');
      
      // Update existing rows with UUIDs
      await client.query('UPDATE chat_sessions SET new_id = uuid_generate_v4() WHERE new_id IS NULL');
      console.log('✅ Updated existing rows with UUIDs');
      
      // Drop the old id column
      await client.query('ALTER TABLE chat_sessions DROP COLUMN id');
      console.log('✅ Dropped old id column');
      
      // Rename new_id to id
      await client.query('ALTER TABLE chat_sessions RENAME COLUMN new_id TO id');
      console.log('✅ Renamed new_id to id');
      
      // Add primary key constraint
      await client.query('ALTER TABLE chat_sessions ADD PRIMARY KEY (id)');
      console.log('✅ Added primary key constraint');
    }

    // Fix users table
    console.log('🔧 Fixing users table...');
    const usersSchema = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `);
    
    if (usersSchema.rows.length > 0 && usersSchema.rows[0].data_type === 'character varying') {
      console.log('⚠️  Users ID column is VARCHAR, converting to UUID...');
      
      await client.query('ALTER TABLE users ADD COLUMN new_id UUID DEFAULT uuid_generate_v4()');
      await client.query('UPDATE users SET new_id = uuid_generate_v4() WHERE new_id IS NULL');
      await client.query('ALTER TABLE users DROP COLUMN id');
      await client.query('ALTER TABLE users RENAME COLUMN new_id TO id');
      await client.query('ALTER TABLE users ADD PRIMARY KEY (id)');
      console.log('✅ Users table fixed');
    }

    // Fix user_stats table
    console.log('🔧 Fixing user_stats table...');
    const statsSchema = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_stats' AND column_name = 'id'
    `);
    
    if (statsSchema.rows.length > 0 && statsSchema.rows[0].data_type === 'character varying') {
      console.log('⚠️  User_stats ID column is VARCHAR, converting to UUID...');
      
      await client.query('ALTER TABLE user_stats ADD COLUMN new_id UUID DEFAULT uuid_generate_v4()');
      await client.query('UPDATE user_stats SET new_id = uuid_generate_v4() WHERE new_id IS NULL');
      await client.query('ALTER TABLE user_stats DROP COLUMN id');
      await client.query('ALTER TABLE user_stats RENAME COLUMN new_id TO id');
      await client.query('ALTER TABLE user_stats ADD PRIMARY KEY (id)');
      console.log('✅ User_stats table fixed');
    }

    // Fix chat_messages table
    console.log('🔧 Fixing chat_messages table...');
    const messagesSchema = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'chat_messages' AND column_name = 'id'
    `);
    
    if (messagesSchema.rows.length > 0 && messagesSchema.rows[0].data_type === 'character varying') {
      console.log('⚠️  Chat_messages ID column is VARCHAR, converting to UUID...');
      
      await client.query('ALTER TABLE chat_messages ADD COLUMN new_id UUID DEFAULT uuid_generate_v4()');
      await client.query('UPDATE chat_messages SET new_id = uuid_generate_v4() WHERE new_id IS NULL');
      await client.query('ALTER TABLE chat_messages DROP COLUMN id');
      await client.query('ALTER TABLE chat_messages RENAME COLUMN new_id TO id');
      await client.query('ALTER TABLE chat_messages ADD PRIMARY KEY (id)');
      console.log('✅ Chat_messages table fixed');
    }

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
    
    // Clean up test data
    await client.query('DELETE FROM chat_sessions WHERE user_id = $1', ['test_user']);
    console.log('🧹 Test data cleaned up');

    client.release();
    await pool.end();
    
    console.log('\n🎉 Table schema fix completed successfully!');
    console.log('Your application should now work properly with PostgreSQL.');
    
  } catch (error) {
    console.error('❌ Error fixing table schema:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

fixTableSchema();
