const { Pool } = require('pg');

const POSTGRESQL_URI = process.env.POSTGRESQL_URI || process.env.DATABASE_URL;

if (!POSTGRESQL_URI) {
  throw new Error('Please define the POSTGRESQL_URI or DATABASE_URL environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.postgres;

if (!cached) {
  cached = global.postgres = { pool: null, promise: null };
}

async function connectDB() {
  if (cached.pool) {
    return cached.pool;
  }

  if (!cached.promise) {
    cached.promise = new Pool({
      connectionString: POSTGRESQL_URI,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 5, // Maximum number of clients in the pool (reduced for Neon)
      min: 0, // Minimum number of clients in the pool
      idleTimeoutMillis: 10000, // Close idle clients after 10 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
      acquireTimeoutMillis: 10000, // Return an error after 10 seconds if a client could not be acquired
      allowExitOnIdle: true, // Allow the pool to close all connections and exit when idle
    });
  }

  try {
    cached.pool = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.pool;
}

// Legacy clientPromise export for backward compatibility
async function clientPromise() {
  const pool = await connectDB();
  return pool;
}

// Helper function to get a client from the pool
async function getClient() {
  const pool = await connectDB();
  return pool;
}

// Helper function to execute queries
async function query(text, params) {
  const pool = await connectDB();
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    // If it's a connection error, try to reconnect
    if (error.code === '57P01' || error.message.includes('Connection terminated') || error.message.includes('connection timeout')) {
      console.log('Connection error detected, clearing cached pool...');
      cached.pool = null;
      cached.promise = null;
    }
    throw error;
  } finally {
    if (client) {
      client.release(); // Always release the client back to the pool
    }
  }
}

module.exports = {
  connectDB,
  clientPromise,
  getClient,
  query
};
