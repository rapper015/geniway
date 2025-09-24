#!/usr/bin/env node

/**
 * PostgreSQL Setup Script for Geniway
 * 
 * This script helps set up the PostgreSQL database with the required schema.
 * Run this after creating your PostgreSQL database and setting up the connection string.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Geniway PostgreSQL Setup');
console.log('============================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('Please create a .env.local file with the following variables:');
  console.log('');
  console.log('POSTGRESQL_URI=postgresql://username:password@localhost:5432/geniway');
  console.log('JWT_SECRET=your_jwt_secret_key_here');
  console.log('OPENAI_API_KEY=your_openai_api_key_here');
  console.log('NODE_ENV=development');
  console.log('');
  process.exit(1);
}

// Read environment variables
const dotenv = require('dotenv');
dotenv.config({ path: envPath });

const POSTGRESQL_URI = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;

if (!POSTGRESQL_URI) {
  console.log('❌ POSTGRESQL_URI or DATABASE_URL not found in .env.local!');
  console.log('Please add your PostgreSQL connection string to .env.local');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('📊 Database URI:', POSTGRESQL_URI.replace(/\/\/.*@/, '//***:***@'));

// Read and execute schema
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.log('❌ Schema file not found at:', schemaPath);
  process.exit(1);
}

async function setupDatabase() {
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded');
    
    // Import PostgreSQL client
    const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: POSTGRESQL_URI,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
  console.log('🔌 Connecting to PostgreSQL...');
  const client = await pool.connect();
  console.log('✅ Connected to PostgreSQL');
  
  console.log('📝 Executing schema...');
  await client.query(schema);
  console.log('✅ Schema executed successfully');
  
  // Test the connection by checking if tables exist
  const result = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'chat_sessions', 'chat_messages', 'user_stats')
    ORDER BY table_name;
  `);
  
  console.log('📋 Created tables:');
  result.rows.forEach(row => {
    console.log(`   ✅ ${row.table_name}`);
  });
  
  client.release();
  await pool.end();
  
  console.log('\n🎉 PostgreSQL setup completed successfully!');
  console.log('You can now start your Next.js application with: npm run dev');
  
  } catch (error) {
    console.error('❌ Error setting up PostgreSQL:', error.message);
    process.exit(1);
  }
}

setupDatabase();

