# OpenAI API Setup Guide

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://ashishoraon2309_db_user:FUrpfANGx2BxhyYM@cluster0.gclwjv4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# NextAuth Configuration (if needed)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production
```

## MongoDB Connection

The application now uses a proper MongoDB utility function (`lib/mongodb.js`) that:
- Uses Mongoose for better schema management
- Implements connection caching to prevent multiple connections
- Handles connection errors gracefully
- Uses proper database models for type safety

## Getting OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

## Features Enabled

### Text Chat
- Context-aware conversations
- Subject-specific responses
- Multi-language support (English, Hindi, Hinglish)
- Educational focus with step-by-step explanations

### Image Analysis
- Upload images for analysis
- Educational explanations of image content
- Subject-specific image interpretation
- OCR and visual content understanding

### Voice Messages
- Voice-to-text conversion
- Context preservation for voice messages
- Educational responses to voice questions

### Context Memory
- Remembers conversation history
- Builds upon previous explanations
- Maintains subject focus throughout conversation
- Personalized responses based on user profile

## Usage Limits

- Uses GPT-4o model for best performance
- Token limit: 2000 tokens per response
- Temperature: 0.7 for balanced creativity and accuracy
- Context window: Last 10 messages for conversation history

## Safety Features

- Content moderation for inappropriate content
- Educational focus prevents direct homework answers
- Encourages learning and understanding
- Maintains appropriate boundaries

## Cost Considerations

- GPT-4o pricing applies
- Token usage is tracked and displayed
- Consider implementing usage limits for production
- Monitor API usage in OpenAI dashboard
