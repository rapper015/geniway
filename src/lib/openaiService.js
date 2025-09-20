import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIService {
  constructor() {
    this.model = 'gpt-4o'; // GPT-4 with vision support
    this.maxTokens = 2000;
    this.temperature = 0.7;
  }

  // Generate system prompt based on subject and user context
  generateSystemPrompt(subject, userName, userRole = 'student', language = 'english') {
    const subjectContext = {
      'mathematics': 'Mathematics (Algebra, Geometry, Calculus, Statistics)',
      'physics': 'Physics (Mechanics, Thermodynamics, Optics, Quantum Physics)',
      'chemistry': 'Chemistry (Organic, Inorganic, Physical Chemistry)',
      'biology': 'Biology (Cell Biology, Genetics, Ecology, Evolution)',
      'english': 'English (Literature, Grammar, Writing, Comprehension)',
      'social-science': 'Social Science (History, Geography, Civics, Economics)',
      'computer-science': 'Computer Science (Programming, Algorithms, Data Structures)',
      'general': 'General academic subjects'
    };

    const subjectName = subjectContext[subject] || 'General academic subjects';

    // Language instructions
    const languageInstructions = {
      'hindi': 'Please respond in Hindi (हिंदी). Use Devanagari script.',
      'hinglish': 'Please respond in Hinglish (mix of Hindi and English). Use both Devanagari script and English as appropriate.',
      'english': 'Please respond in English.'
    };

    return `You are Geni Ma'am, an AI learning assistant designed to help students with their academic questions. 

CONTEXT:
- Subject Focus: ${subjectName}
- Student Name: ${userName}
- Student Role: ${userRole}
- Language Support: English, Hindi, and Hinglish
- RESPONSE LANGUAGE: ${languageInstructions[language] || languageInstructions['english']}

TEACHING PHILOSOPHY:
1. **Step-by-step Learning**: Break down complex problems into manageable steps
2. **Concept Understanding**: Focus on teaching concepts, not just giving answers
3. **Encouraging Questions**: Always encourage students to ask follow-up questions
4. **Multiple Approaches**: Show different ways to solve problems when applicable
5. **Real-world Connections**: Relate concepts to practical examples when possible

RESPONSE GUIDELINES:
- Be warm, encouraging, and supportive like a caring teacher
- Use clear, age-appropriate language
- Provide detailed explanations with examples
- Ask clarifying questions when needed
- Encourage critical thinking
- Support multiple languages (English/Hindi/Hinglish)
- For images: Analyze the content and provide educational explanations
- Remember previous context in the conversation

SAFETY GUIDELINES:
- Focus on educational content only
- Do not provide direct answers to homework/exams
- Encourage learning and understanding
- Maintain appropriate boundaries
- Report any inappropriate content

Remember to maintain context throughout the conversation and build upon previous explanations.`;
  }

  // Process text message with context
  async processTextMessage(message, context = {}) {
    try {
      const { subject, userName, userRole, conversationHistory, language } = context;
      
      // Build conversation history for context
      const messages = [
        {
          role: 'system',
          content: this.generateSystemPrompt(subject, userName, userRole, language)
        }
      ];

      // Add conversation history (last 10 messages for context)
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-10);
        recentHistory.forEach(msg => {
          messages.push({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        });
      }

      // Add current message
      messages.push({
        role: 'user',
        content: message
      });

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return {
        success: true,
        content: response.choices[0].message.content,
        usage: response.usage,
        model: this.model
      };

    } catch (error) {
      console.error('OpenAI API Error:', error);
      return {
        success: false,
        error: error.message,
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
      };
    }
  }

  // Process image with text message
  async processImageMessage(textMessage, imageUrl, context = {}) {
    try {
      const { subject, userName, userRole, conversationHistory, language } = context;
      
      // Build conversation history for context
      const messages = [
        {
          role: 'system',
          content: this.generateSystemPrompt(subject, userName, userRole, language)
        }
      ];

      // Add conversation history (last 8 messages for context, leaving room for image)
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-8);
        recentHistory.forEach(msg => {
          messages.push({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        });
      }

      // Add current message with image
      const messageContent = [
        {
          type: 'text',
          text: textMessage || "Please analyze this image and help me understand it."
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl,
            detail: 'high'
          }
        }
      ];

      messages.push({
        role: 'user',
        content: messageContent
      });

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return {
        success: true,
        content: response.choices[0].message.content,
        usage: response.usage,
        model: this.model,
        hasImage: true
      };

    } catch (error) {
      console.error('OpenAI Vision API Error:', error);
      return {
        success: false,
        error: error.message,
        content: "I apologize, but I'm having trouble analyzing the image right now. Please try again or describe what you see in the image."
      };
    }
  }

  // Process voice message (transcript)
  async processVoiceMessage(transcript, context = {}) {
    try {
      // Add voice context to the message
      const voiceMessage = `[Voice Message] ${transcript}`;
      return await this.processTextMessage(voiceMessage, context);
    } catch (error) {
      console.error('OpenAI Voice Processing Error:', error);
      return {
        success: false,
        error: error.message,
        content: "I apologize, but I'm having trouble processing your voice message right now. Please try typing your question instead."
      };
    }
  }

  // Get conversation context from messages
  getConversationContext(messages, subject, userName, userRole = 'student') {
    return {
      subject,
      userName,
      userRole,
      conversationHistory: messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        messageType: msg.messageType,
        timestamp: msg.timestamp
      }))
    };
  }

  // Analyze image content for educational purposes
  async analyzeImageForEducation(imageUrl, subject, context = {}) {
    try {
      const analysisPrompt = `Analyze this image from an educational perspective for ${subject}. 
      Identify:
      1. What the image shows
      2. Key concepts or topics visible
      3. Educational value
      4. Questions a student might have
      5. How it relates to ${subject}
      
      Provide a clear, educational explanation that would help a student understand the content.`;

      return await this.processImageMessage(analysisPrompt, imageUrl, context);
    } catch (error) {
      console.error('Image Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        content: "I can see the image, but I'm having trouble analyzing it right now. Could you describe what you see or ask a specific question about it?"
      };
    }
  }

  // Generate follow-up questions based on context
  async generateFollowUpQuestions(lastMessage, subject, context = {}) {
    try {
      const followUpPrompt = `Based on the previous explanation about ${subject}, generate 2-3 thoughtful follow-up questions that would help the student deepen their understanding. 
      
      Previous context: ${lastMessage}
      
      Generate questions that:
      1. Build on the previous explanation
      2. Encourage critical thinking
      3. Are appropriate for the subject level
      4. Help the student practice the concept
      
      Format as a simple list of questions.`;

      const response = await this.processTextMessage(followUpPrompt, context);
      
      if (response.success) {
        return {
          success: true,
          questions: response.content.split('\n').filter(q => q.trim().length > 0)
        };
      }
      
      return response;
    } catch (error) {
      console.error('Follow-up Questions Error:', error);
      return {
        success: false,
        error: error.message,
        questions: []
      };
    }
  }

  // Check if message contains inappropriate content
  async moderateContent(message) {
    try {
      const response = await openai.moderations.create({
        input: message
      });

      const moderation = response.results[0];
      
      return {
        flagged: moderation.flagged,
        categories: moderation.categories,
        categoryScores: moderation.category_scores
      };
    } catch (error) {
      console.error('Content Moderation Error:', error);
      return {
        flagged: false,
        categories: {},
        categoryScores: {}
      };
    }
  }

  // Main method for generating text responses (called by chat API)
  async generateResponse(message, subject, language = 'english') {
    try {
      const context = {
        subject: subject || 'general',
        userName: 'Student',
        userRole: 'student',
        language: language
      };

      const result = await this.processTextMessage(message, context);
      
      if (result.success) {
        return {
          content: result.content,
          tokenUsage: result.usage?.total_tokens || 0,
          model: result.model
        };
      } else {
        return {
          content: result.content,
          tokenUsage: 0,
          model: 'error'
        };
      }
    } catch (error) {
      console.error('Generate Response Error:', error);
      return {
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        tokenUsage: 0,
        model: 'error'
      };
    }
  }

  // Main method for generating image responses (called by chat API)
  async generateImageResponse(message, imageUrl, subject, language = 'english') {
    try {
      const context = {
        subject: subject || 'general',
        userName: 'Student',
        userRole: 'student',
        language: language
      };

      const result = await this.processImageMessage(message, imageUrl, context);
      
      if (result.success) {
        return {
          content: result.content,
          tokenUsage: result.usage?.total_tokens || 0,
          model: result.model
        };
      } else {
        return {
          content: result.content,
          tokenUsage: 0,
          model: 'error'
        };
      }
    } catch (error) {
      console.error('Generate Image Response Error:', error);
      return {
        content: "I'm sorry, I'm having trouble analyzing the image right now. Please try again.",
        tokenUsage: 0,
        model: 'error'
      };
    }
  }
}

// Create singleton instance
export const openaiService = new OpenAIService();
