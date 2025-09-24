#!/usr/bin/env node

/**
 * PostgreSQL Connection Test Script
 * 
 * This script tests the PostgreSQL connection and basic operations.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🧪 Testing PostgreSQL Connection');
console.log('================================\n');

const POSTGRESQL_URI = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;

if (!POSTGRESQL_URI) {
  console.log('❌ POSTGRESQL_URI or DATABASE_URL not found in .env.local!');
  console.log('Please add your PostgreSQL connection string to .env.local');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('📊 Database URI:', POSTGRESQL_URI.replace(/\/\/.*@/, '//***:***@'));

async function testConnection() {
  let pool = null;
  try {
    // Test database connection
    const { connectDB, query } = require('../lib/database-cjs.js');
    
    console.log('🔌 Testing database connection...');
    pool = await connectDB();
    console.log('✅ Database connection successful');
    
    // Test basic query
    console.log('📝 Testing basic query...');
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Query successful:', result.rows[0].current_time);
    
    // Test table existence
    console.log('📋 Checking table existence...');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'chat_sessions', 'chat_messages', 'user_stats')
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length === 4) {
      console.log('✅ All required tables exist:');
      tablesResult.rows.forEach(row => {
        console.log(`   ✅ ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Some tables are missing. Run: npm run setup-db');
      console.log('Found tables:', tablesResult.rows.map(r => r.table_name));
    }
    
    // Test model imports (skipped in test script due to ES module compatibility)
    console.log('📦 Model imports will be tested when the application runs');
    
    console.log('\n🎉 PostgreSQL connection test completed successfully!');
    console.log('Your application is ready to use PostgreSQL.');
    
  } catch (error) {
    console.error('❌ Error testing PostgreSQL connection:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure PostgreSQL server is running');
    console.error('2. Check your connection string in .env.local');
    console.error('3. Ensure the database exists');
    console.error('4. Verify username/password are correct');
    process.exit(1);
  } finally {
    // Properly close the pool if it has an end method
    if (pool && typeof pool.end === 'function') {
      await pool.end();
    }
  }
}

testConnection();
