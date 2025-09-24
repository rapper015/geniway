# PostgreSQL Migration Guide

This guide will help you migrate your Geniway application from MongoDB to PostgreSQL.

## Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database running (local or cloud)
2. **Database Access**: Connection details (host, port, username, password, database name)

## Step 1: Install Dependencies

The required PostgreSQL dependencies are already installed:
- `pg` - PostgreSQL client for Node.js
- `@types/pg` - TypeScript definitions
- `dotenv` - Environment variable management

## Step 2: Set Up Environment Variables

Create a `.env.local` file in your project root with the following variables:

**⚠️ IMPORTANT: You must create this file before proceeding!**

```env
# PostgreSQL Database Configuration
POSTGRESQL_URI=postgresql://username:password@localhost:5432/geniway
# Alternative: Use DATABASE_URL (commonly used by hosting providers)
# DATABASE_URL=postgresql://username:password@localhost:5432/geniway

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Next.js Environment
NODE_ENV=development
```

**Replace the following:**
- `username` - Your PostgreSQL username
- `password` - Your PostgreSQL password
- `localhost:5432` - Your PostgreSQL host and port
- `geniway` - Your database name
- `your_jwt_secret_key_here` - A secure random string for JWT signing
- `your_openai_api_key_here` - Your OpenAI API key

## Step 3: Set Up Database Schema

Run the database setup script to create all necessary tables:

```bash
npm run setup-db
```

This script will:
- ✅ Check your environment variables
- ✅ Connect to your PostgreSQL database
- ✅ Create all required tables (users, chat_sessions, chat_messages, user_stats)
- ✅ Set up indexes for better performance
- ✅ Create triggers for automatic timestamp updates

## Step 4: Verify Migration

After running the setup script, you should see output like:

```
🚀 Geniway PostgreSQL Setup
============================

✅ Environment variables loaded
📊 Database URI: postgresql://***:***@localhost:5432/geniway
✅ Schema file loaded
🔌 Connecting to PostgreSQL...
✅ Connected to PostgreSQL
📝 Executing schema...
✅ Schema executed successfully
📋 Created tables:
   ✅ chat_messages
   ✅ chat_sessions
   ✅ user_stats
   ✅ users

🎉 PostgreSQL setup completed successfully!
You can now start your Next.js application with: npm run dev
```

## Step 5: Start Your Application

```bash
npm run dev
```

Your application should now be running with PostgreSQL instead of MongoDB!

## Database Schema

The migration creates the following tables:

### Users Table
- User profiles and authentication data
- All user preferences and settings
- Profile completion tracking

### Chat Sessions Table
- Chat session metadata
- Session status and configuration
- Message count tracking

### Chat Messages Table
- Individual chat messages
- Message types and content
- Token usage tracking

### User Stats Table
- User analytics and usage statistics
- Quiz scores and study time
- Streak tracking

## Troubleshooting

### Connection Issues
- Verify your PostgreSQL server is running
- Check your connection string format
- Ensure your database exists
- Verify username/password are correct

### Permission Issues
- Ensure your PostgreSQL user has CREATE TABLE permissions
- Check if your user can create indexes and triggers

### Environment Variables
- Make sure `.env.local` is in your project root
- Verify all required variables are set
- Check for typos in variable names

## Rollback (if needed)

If you need to rollback to MongoDB:

1. Restore the original `lib/mongodb.js` file
2. Restore the original model files in `models/`
3. Update all import statements back to `mongodb.js`
4. Remove PostgreSQL dependencies: `npm uninstall pg @types/pg dotenv`

## Support

If you encounter any issues during migration, check:
1. PostgreSQL server logs
2. Application console output
3. Database connection status
4. Environment variable configuration

The application should work exactly the same as before, just with PostgreSQL as the backend database instead of MongoDB.

