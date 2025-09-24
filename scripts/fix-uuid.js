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

async function fixUUID() {
  const pool = new Pool({
    connectionString: POSTGRESQL_URI,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    console.log('🔌 Connected to PostgreSQL');

    // Check if UUID extension exists
    console.log('📋 Checking UUID extension...');
    const extResult = await client.query("SELECT * FROM pg_extension WHERE extname = 'uuid-ossp'");
    
    if (extResult.rows.length === 0) {
      console.log('⚠️  UUID extension not found, creating it...');
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✅ UUID extension created');
    } else {
      console.log('✅ UUID extension already exists');
    }

    // Check the chat_sessions table structure
    console.log('📋 Checking chat_sessions table structure...');
    const tableResult = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'chat_sessions' 
      ORDER BY ordinal_position
    `);
    
    console.log('Table structure:');
    tableResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'}) - default: ${row.column_default || 'none'}`);
    });

    // Test UUID generation
    console.log('🧪 Testing UUID generation...');
    const uuidResult = await client.query('SELECT uuid_generate_v4() as test_uuid');
    console.log('✅ UUID generation works:', uuidResult.rows[0].test_uuid);

    // Test inserting a session
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
    
    console.log('\n🎉 UUID fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing UUID:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

fixUUID();
