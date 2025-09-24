
import { connectDB } from '../../../lib/database';
import { ChatSession } from '../../../models';
import { ChatMessage, UserStats, User } from '../../../models';
import OpenAI from 'openai';

export class SimpleOrchestrator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Geni Ma'am system prompt
    this.systemPrompt = `You are Geni Ma'am, a warm and knowledgeable Indian tutor specializing in CBSE curriculum for students grades 6-12. 

**CORE IDENTITY:**
- You are an Indian educator who understands Indian culture, values, and educational system
- You use Indian names and cultural references in your examples
- You adapt your explanations to the student's grade level, board, and learning preferences
- You provide clear, educational explanations with appropriate scaffolding

**INDIAN CONTEXT GUIDELINES:**
- Always use Indian names (Priya, Arjun, Sita, Raj, Ananya, etc.) in examples
- Use Indian currency (₹), measurements, and cultural contexts
- Make examples relevant to Indian students' daily experiences
- Use Indian educational terminology and board-specific content

**PERSONALIZATION:**
- Adapt language complexity based on student's grade level
- Adjust explanation depth based on learning pace preference
- Incorporate learning style preferences (Visual, Voice, Text, Kinesthetic)
- Use location-specific examples when available`;
    
    // Section types in US-3.5 scaffolding framework
    this.sectionTypes = {
      PROBE: 'probe',
      BIG_IDEA: 'big_idea', 
      EXAMPLE: 'example',
      QUICK_CHECK: 'quick_check',
      TRY_IT: 'try_it',
      RECAP: 'recap',
      MCQ_VALIDATION: 'mcq_validation',
      ALTERNATIVE_EXPLANATION: 'alternative_explanation'
    };
  }

  async processStudentInput(sessionId, studentInput, onEvent) {
    try {
      
      // Get or create session
      let session = await this.getSession(sessionId);
      if (!session) {
        session = await this.createSession(studentInput.userId, studentInput.subject);
      }

      // Add user message
      await this.addMessage({
        sessionId: session.id.toString(),
        userId: studentInput.userId,
        sender: 'user',
        messageType: studentInput.type,
        content: studentInput.text,
        imageUrl: studentInput.imageUrl
      });

      // Get conversation context
      const context = await this.buildTutoringContext(session, studentInput);
      
      // Determine which section to generate based on intent
      const sectionType = this.determineSectionByIntent(context);
      
      // Generate appropriate section
      let sectionContent;
      try {
        sectionContent = await this.generateSection(sectionType, context);
      } catch (sectionError) {
        console.error('[SimpleOrchestrator] Section generation failed, using fallback:', sectionError);
        // Fallback to simple response
        sectionContent = {
          content: `I understand you're asking about: "${studentInput.text}". Let me help you with that.`,
          metadata: {
            sectionType: 'fallback',
            tokensUsed: 0,
            model: 'fallback'
          }
        };
      }
      
      // Add AI message
      const aiMessage = await this.addMessage({
        sessionId: session.id.toString(),
        userId: studentInput.userId,
        sender: 'ai',
        messageType: 'text',
        content: sectionContent.content
      });

      // Send structured events
      if (onEvent) {
        onEvent({
          type: 'section',
          data: {
            section: {
              id: `section-${Date.now()}`,
              type: sectionType,
              title: this.getSectionTitle(sectionType),
              content: sectionContent.content,
              metadata: sectionContent.metadata,
              isCompleted: true
            },
            isComplete: true
          },
          timestamp: new Date(),
          sessionId: session.id.toString()
        });

        onEvent({
          type: 'final',
          data: {
            section: {
              id: `section-${Date.now()}`,
              type: sectionType,
              title: this.getSectionTitle(sectionType),
              content: sectionContent.content,
              metadata: sectionContent.metadata,
              isCompleted: true
            },
            performance: {
              ttft: 500,
              totalTime: 2000,
              tokensGenerated: sectionContent.metadata?.tokensUsed || 0
            }
          },
          timestamp: new Date(),
          sessionId: session.id.toString()
        });
      }

      return {
        success: true,
        message: aiMessage,
        response: sectionContent,
        sectionType: sectionType
      };
    } catch (error) {
      console.error('[SimpleOrchestrator] Error processing student input:', error);
      console.error('[SimpleOrchestrator] Error stack:', error.stack);
      console.error('[SimpleOrchestrator] Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        status: error.status,
        name: error.name
      });
      
      if (onEvent) {
        onEvent({
          type: 'error',
          data: {
            error: error.message || 'Unknown error occurred',
            code: 'PROCESSING_ERROR',
            retryable: true,
            details: {
              name: error.name,
              code: error.code,
              type: error.type,
              status: error.status
            }
          },
          timestamp: new Date(),
          sessionId
        });
      }
      
      throw error;
    }
  }

  async getSession(sessionId) {
    try {
      await connectDB();
      return await ChatSession.findById(sessionId);
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async createSession(userId, subject = 'general') {
    try {
      await connectDB();
      
      const session = new ChatSession({
        userId,
        subject,
        title: `Chat - ${new Date().toLocaleDateString()}`,
        messageCount: 0,
        createdAt: new Date(),
        lastActive: new Date()
      });

      const savedSession = await session.save();
      
      // Initialize user stats if not exists
      await this.ensureUserStats(userId);
      
      return savedSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async addMessage(messageData) {
    try {
      await connectDB();
      
      const message = new ChatMessage({
        sessionId: messageData.sessionId,
        userId: messageData.userId,
        sender: messageData.sender,
        messageType: messageData.messageType,
        content: messageData.content,
        imageUrl: messageData.imageUrl,
        createdAt: new Date()
      });

      const savedMessage = await message.save();

      // Update session message count
      await ChatSession.findByIdAndUpdate(messageData.sessionId, {
        $inc: { messageCount: 1 },
        lastActive: new Date()
      });

      // Update user stats
      await this.updateMessageStats(messageData.userId, messageData.messageType);

      return {
        id: savedMessage.id.toString(),
        sessionId: messageData.sessionId,
        userId: messageData.userId,
        sender: messageData.sender,
        type: messageData.messageType,
        content: messageData.content,
        imageUrl: messageData.imageUrl,
        timestamp: savedMessage.createdAt
      };
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // OLD METHOD - DEPRECATED: Using new scaffolding framework instead
  async generateResponse(studentInput, session) {
    try {
      // Get recent conversation history
      const messages = await this.getRecentMessages(session.id.toString(), 10);
      
      // Build conversation context
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Create system prompt
      const systemPrompt = `You are Geni Ma'am, an expert AI tutor specializing in personalized education for students. 

Your role:
- Be encouraging, patient, and supportive
- Use age-appropriate language and examples
- Break down complex concepts into simple steps
- Provide clear explanations with examples
- Encourage critical thinking
- Make learning fun and engaging

Current subject: ${session.subject || 'general'}
Student input: ${studentInput.text}

Respond in a helpful, educational manner. If the student uploaded an image, analyze it and provide relevant educational content.`;

      // Add system prompt to conversation
      conversationHistory.unshift({ role: 'system', content: systemPrompt });

      // Generate response using OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 3000
      });

      const content = response.choices[0].message.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
      const tokensUsed = response.usage?.total_tokens || 0;

      return {
        content,
        tokensUsed,
        model: 'gpt-4o'
      };
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback response
      return {
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        tokensUsed: 0,
        model: 'fallback'
      };
    }
  }

  async getRecentMessages(sessionId, limit = 10) {
    try {
      await connectDB();
      
      const messages = await ChatMessage.find({ 
        sessionId,
        limit: limit
      });

      return messages.map(msg => ({
        id: msg.id.toString(),
        sessionId: msg.sessionId,
        userId: msg.userId,
        sender: msg.sender,
        type: msg.messageType,
        content: msg.content,
        imageUrl: msg.imageUrl,
        timestamp: msg.createdAt
      })).reverse();
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
  }

  async ensureUserStats(userId) {
    try {
      const existingStats = await UserStats.findOne({ userId });
      if (!existingStats) {
        const stats = new UserStats({
          userId,
          totalSessions: 0,
          totalMessages: 0,
          totalTextMessages: 0,
          totalVoiceMessages: 0,
          totalImageMessages: 0,
          totalTokensUsed: 0,
          lastActive: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await stats.save();
      }
    } catch (error) {
      console.error('Error ensuring user stats:', error);
    }
  }

  async updateMessageStats(userId, messageType) {
    try {
      const updateFields = {
        $inc: { totalMessages: 1 },
        $set: { lastActive: new Date(), updatedAt: new Date() }
      };

      switch (messageType) {
        case 'text':
          updateFields.$inc.totalTextMessages = 1;
          break;
        case 'voice':
          updateFields.$inc.totalVoiceMessages = 1;
          break;
        case 'image':
          updateFields.$inc.totalImageMessages = 1;
          break;
      }

      await UserStats.findOneAndUpdate(
        { userId },
        updateFields,
        { upsert: true }
      );
    } catch (error) {
      console.error('Error updating message stats:', error);
    }
  }

  // Build tutoring context from session and student input
  async buildTutoringContext(session, studentInput) {
    try {
      const messages = await ChatMessage.find({ 
        sessionId: session.id,
        limit: 10
      }); // Last 10 messages for context

      // Fetch user profile information for personalization
      let userProfile = null;
      try {
        if (studentInput.userId) {
          userProfile = await User.findOne({ 
            $or: [
              { _id: studentInput.userId },
              { email: studentInput.userId }
            ]
          });
        }
      } catch (profileError) {
        console.error('[SimpleOrchestrator] Error fetching user profile:', profileError);
      }

      // Use guest profile data if user profile not found in database
      const profileData = userProfile || studentInput.guestProfile || {};

      // Build personalized curriculum context
      // Map language from studentInput to the format expected by the AI
      const mapLanguage = (lang) => {
        switch (lang) {
          case 'hindi':
          case 'हिंदी':
            return 'hi';
          case 'hinglish':
          case 'हिंग्लिश':
            return 'hinglish';
          case 'english':
          case 'अंग्रेजी':
          default:
            return 'en';
        }
      };

      const curriculumContext = {
        subject: session.subject || 'general',
        class: profileData?.grade?.toString() || '10',
        board: profileData?.board || 'CBSE',
        language: mapLanguage(studentInput.language) || profileData?.langPref || 'en',
        learningStyle: profileData?.learningStyle || 'Text',
        pace: profileData?.pace || 'Normal',
        state: profileData?.state || '',
        city: profileData?.city || '',
        role: profileData?.role || 'student',
        ageBand: profileData?.ageBand || '11-14'
      };


      return {
        sessionId: session.id.toString(),
        userId: studentInput.userId,
        subject: session.subject || 'general',
        currentInput: studentInput.text,
        currentImageUrl: studentInput.imageUrl, // Include image data
        messageHistory: messages,
        curriculumContext: curriculumContext,
        userProfile: userProfile, // Include full user profile for advanced personalization
        profileData: profileData // Include the profile data being used (either from DB or guest)
      };
    } catch (error) {
      console.error('[SimpleOrchestrator] Error building tutoring context:', error);
      throw error;
    }
  }

  // Determine which section to generate based on user intent
  determineSectionByIntent(context) {
    const latestInput = context.currentInput.toLowerCase();
    const messageHistory = context.messageHistory;
    
    
    // Check if this is an MCQ response
    if (this.isMCQResponse(latestInput)) {
      return this.sectionTypes.MCQ_VALIDATION;
    }
    
    // Check if user confirmed understanding
    if (this.userConfirmedUnderstanding(latestInput)) {
      return this.sectionTypes.RECAP;
    }
    
    // Check if this is an initial question (no previous AI messages)
    const hasAIMessages = messageHistory.some(msg => msg.sender === 'ai');
    if (!hasAIMessages) {
      return this.sectionTypes.BIG_IDEA;
    }
    
    // Check for specific requests (order matters - more specific first)
    if (this.isNotClearRequest(latestInput)) {
      return this.sectionTypes.ALTERNATIVE_EXPLANATION;
    }
    
    if (this.isHintRequest(latestInput)) {
      return this.sectionTypes.TRY_IT;
    }
    
    if (this.isStepsRequest(latestInput)) {
      return this.sectionTypes.EXAMPLE;
    }
    
    if (this.isExampleRequest(latestInput)) {
      return this.sectionTypes.EXAMPLE;
    }
    
    // Default to Big Idea for new concepts
    return this.sectionTypes.BIG_IDEA;
  }

  // Helper methods for intent detection
  isMCQResponse(input) {
    return /^(i selected|i chose|option [a-d]|answer [a-d]|it's [a-d])/i.test(input);
  }

  userConfirmedUnderstanding(input) {
    return /^(got it|understood|clear|thanks|thank you|i get it|i understand)/i.test(input);
  }

  isExampleRequest(input) {
    return /^(example|show me|demonstrate|can you give|give me an example)/i.test(input);
  }

  isStepsRequest(input) {
    return /^(steps|step by step|detailed steps|show steps|show detailed steps|how to|process|procedure|break it down|explain step by step|walk me through|numbered steps|step 1|step 2|step 3|please show detailed steps)/i.test(input);
  }

  isHintRequest(input) {
    return /^(hint|help|can you give me a hint|give me a hint)/i.test(input);
  }

  isNotClearRequest(input) {
    return /^(not clear|confused|don't understand|can you explain this differently)/i.test(input);
  }

  // Generate section content based on type
  async generateSection(sectionType, context) {
    try {
      const prompt = this.buildSectionPrompt(sectionType, context);
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
      }
      
      // Prepare messages array
      const messages = [
        { role: 'system', content: this.systemPrompt }
      ];

      // Check if we have an image to analyze
      if (context.currentImageUrl) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: context.currentImageUrl,
                detail: 'high'
              }
            }
          ]
        });
      } else {
        messages.push({ role: 'user', content: prompt });
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.3,
        max_tokens: this.getMaxTokensForSection(sectionType)
      });

      const content = response.choices[0].message.content;
      
      return {
        content: content,
        metadata: {
          sectionType: sectionType,
          tokensUsed: response.usage?.total_tokens || 0,
          model: 'gpt-4o'
        }
      };
    } catch (error) {
      console.error(`[SimpleOrchestrator] Error generating ${sectionType} section:`, error);
      console.error('[SimpleOrchestrator] Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        status: error.status
      });
      throw error;
    }
  }

  // Build section-specific prompts
  buildSectionPrompt(sectionType, context) {
    const { currentInput, currentImageUrl, curriculumContext, messageHistory } = context;
    
    switch (sectionType) {
      case this.sectionTypes.BIG_IDEA:
        return this.buildBigIdeaPrompt(currentInput, currentImageUrl, curriculumContext, messageHistory);
      
      case this.sectionTypes.EXAMPLE:
        return this.buildExamplePrompt(currentInput, currentImageUrl, curriculumContext, messageHistory);
      
      case this.sectionTypes.QUICK_CHECK:
        return this.buildQuickCheckPrompt(currentInput, currentImageUrl, curriculumContext);
      
      case this.sectionTypes.TRY_IT:
        return this.buildTryItPrompt(currentInput, currentImageUrl, curriculumContext, messageHistory);
      
      case this.sectionTypes.RECAP:
        return this.buildRecapPrompt(currentInput, currentImageUrl, curriculumContext, messageHistory);
      
      case this.sectionTypes.MCQ_VALIDATION:
        return this.buildMCQValidationPrompt(currentInput, currentImageUrl, curriculumContext, messageHistory);
      
      case this.sectionTypes.ALTERNATIVE_EXPLANATION:
        return this.buildAlternativeExplanationPrompt(currentInput, currentImageUrl, curriculumContext, messageHistory);
      
      default:
        return this.buildBigIdeaPrompt(currentInput, currentImageUrl, curriculumContext, messageHistory);
    }
  }

  // Build personalized context based on user profile
  buildPersonalizedContext(curriculumContext) {
    const { class: grade, board, state, city, learningStyle, pace, role, ageBand } = curriculumContext;
    
    let context = `Student Profile:
- Grade: Class ${grade}
- Board: ${board}
- Learning Style: ${learningStyle}
- Pace Preference: ${pace}
- Role: ${role}
- Age Band: ${ageBand}`;

    if (state) {
      context += `\n- Location: ${city ? `${city}, ` : ''}${state}`;
    }

    // Add grade-specific guidance
    if (parseInt(grade) <= 8) {
      context += `\n- Use simple language and basic concepts appropriate for younger students`;
    } else if (parseInt(grade) >= 11) {
      context += `\n- Use advanced concepts and detailed explanations for senior students`;
    }

    // Add learning style guidance
    if (learningStyle === 'Visual') {
      context += `\n- Include visual descriptions and diagrams in explanations`;
    } else if (learningStyle === 'Voice') {
      context += `\n- Use conversational tone and audio-friendly explanations`;
    } else if (learningStyle === 'Kinesthetic') {
      context += `\n- Include hands-on activities and practical examples`;
    }

    // Add pace guidance
    if (pace === 'Fast') {
      context += `\n- Provide quick, direct answers without lengthy explanations`;
    } else if (pace === 'Detailed') {
      context += `\n- Provide thorough, comprehensive explanations with multiple examples`;
    }

    return context;
  }

  // Section-specific prompt builders
  buildBigIdeaPrompt(input, imageUrl, curriculumContext, messageHistory) {
    const conversationContext = messageHistory.length > 0 
      ? `Previous conversation: ${messageHistory.slice(-3).map(m => `${m.sender}: ${m.content}`).join('\n')}`
      : '';

    const imageContext = imageUrl 
      ? `\n\n**IMAGE ANALYSIS REQUIRED:**
The student has uploaded an image. Please analyze the image carefully and provide educational content related to what you see in the image. Focus on:
- What educational concepts are visible in the image
- How the image relates to the student's question: "${input}"
- Provide specific insights about the content shown in the image
- If the image contains text, equations, diagrams, or educational content, explain them clearly`
      : '';

    // Build personalized context
    const personalizedContext = this.buildPersonalizedContext(curriculumContext);

    const prompt = `You are Geni Ma'am, a warm Indian tutor. Generate a Big Idea section per US-3.5 scaffolding framework.

${conversationContext}

**US-3.5 BIG IDEA REQUIREMENTS:**
- STRICT WORD LIMIT: Maximum 120 words  
- PEDAGOGICAL STRUCTURE: Core concept explanation with grade-appropriate language
- REAL-WORLD CONNECTION: Link to student's prior knowledge or everyday examples relevant to Indian context
- ACADEMIC TONE: Appropriate for Class ${curriculumContext.class} (${curriculumContext.board} board)

**PERSONALIZED CONTEXT:**
${personalizedContext}

**CONTENT GUIDELINES:**
Subject: ${curriculumContext.subject} | Language: ${curriculumContext.language === 'hi' ? 'Hindi' : curriculumContext.language === 'hinglish' ? 'Hinglish' : 'English'}
Topic: ${curriculumContext.subject} | Original: "${input}"${imageContext}

**LANGUAGE INSTRUCTIONS:**
${(() => {
  const instruction = curriculumContext.language === 'hi' ? 'IMPORTANT: Respond entirely in Hindi (हिंदी). Use Devanagari script for all text.' : 
    curriculumContext.language === 'hinglish' ? 'IMPORTANT: Respond in Hinglish (mix of Hindi and English). Use both Devanagari script and English as appropriate.' : 
    'IMPORTANT: Respond in English.';
  return instruction;
})()}

**INDIAN CONTEXT REQUIREMENTS:**
- Use Indian names (like Priya, Arjun, Sita, Raj, etc.) in examples
- Use Indian cultural references and examples
- Make examples relevant to Indian students' experiences
- Use Indian currency (₹), measurements, and contexts

**OUTPUT FORMAT:**
Provide clear, concise explanation of the core concept in exactly 120 words or fewer. Focus on:
1. Main concept definition  
2. Why it matters
3. One concrete real-world relevant example with Indian context
4. Connection to student's question${imageUrl ? ' and the uploaded image' : ''}`;

    
    return prompt;
  }

  buildExamplePrompt(input, imageUrl, curriculumContext, messageHistory) {
    const conversationContext = messageHistory.length > 0 
      ? `Previous conversation: ${messageHistory.slice(-3).map(m => `${m.sender}: ${m.content}`).join('\n')}`
      : '';

    const imageContext = imageUrl 
      ? `\n\n**IMAGE ANALYSIS REQUIRED:**
The student has uploaded an image. Please analyze the image and provide step-by-step examples based on what you see in the image. Focus on:
- What educational concepts are visible in the image
- How to work through the problem or concept shown in the image
- Provide specific steps related to the content in the image`
      : '';

    // Check if user specifically asked for detailed steps
    const isDetailedStepsRequest = /detailed steps|show detailed steps|break it down|explain step by step|walk me through/i.test(input);

    // Build personalized context
    const personalizedContext = this.buildPersonalizedContext(curriculumContext);

    const prompt = `You are Geni Ma'am. Here's the complete conversation context:

${conversationContext}

EXAMPLE SECTION (3-5 numbered steps): Provide a ${isDetailedStepsRequest ? 'detailed, comprehensive' : 'clear'} step-by-step example based on the complete conversation history. 

**IMPORTANT FOR STEPS REQUESTS:**
- Use clear numbered format: Step 1:, Step 2:, Step 3:, etc.
- Each step should be specific and actionable
- Build upon the previous step logically
- Make each step easy to follow and understand${imageContext}

**PERSONALIZED CONTEXT:**
${personalizedContext}

Context Details:
Subject: ${curriculumContext.subject} (Class ${curriculumContext.class}) 
Topic: ${curriculumContext.subject}
Board: ${curriculumContext.board}
Language: ${curriculumContext.language === 'hi' ? 'Hindi' : curriculumContext.language === 'hinglish' ? 'Hinglish' : 'English'}

**LANGUAGE INSTRUCTIONS:**
${(() => {
  const instruction = curriculumContext.language === 'hi' ? 'IMPORTANT: Respond entirely in Hindi (हिंदी). Use Devanagari script for all text.' : 
    curriculumContext.language === 'hinglish' ? 'IMPORTANT: Respond in Hinglish (mix of Hindi and English). Use both Devanagari script and English as appropriate.' : 
    'IMPORTANT: Respond in English.';
  return instruction;
})()}

**INDIAN CONTEXT REQUIREMENTS:**
- Use Indian names (like Priya, Arjun, Sita, Raj, etc.) in examples
- Use Indian cultural references and examples
- Make examples relevant to Indian students' experiences
- Use Indian currency (₹), measurements, and contexts

IMPORTANT: 
- Always reference the ORIGINAL question topic ("${input}")
- If asking for "detailed steps", provide comprehensive, thorough steps with explanations
- If asking for "simpler example", simplify the SAME topic, don't switch topics
- Build on the previous explanation context provided
- Each step should be clear, actionable, and educational${imageUrl ? '\n- Focus on the content visible in the uploaded image' : ''}
- Use examples that are culturally relevant to Indian students

Format as:
Step 1: [Specific action] - [Clear reason and explanation with Indian context]
Step 2: [Specific action] - [Clear reason and explanation with Indian context]
Step 3: [Specific action] - [Clear reason and explanation with Indian context]
${isDetailedStepsRequest ? 'Step 4: [Additional detail] - [Further explanation with Indian context]\nStep 5: [Final step] - [Summary and verification with Indian context]' : ''}

Focus specifically on the original topic: "${input}"${imageUrl ? ' and the uploaded image' : ''}`;

    
    return prompt;
  }

  buildQuickCheckPrompt(input, imageUrl, curriculumContext) {
    const imageContext = imageUrl 
      ? `\n\n**IMAGE ANALYSIS REQUIRED:**
The student has uploaded an image. Please create a quiz question based on the content visible in the image. Focus on:
- What educational concepts are shown in the image
- Create a question that tests understanding of the image content
- Make the question directly related to what's visible in the image`
      : '';

    return `You are Geni Ma'am, a warm Indian tutor. Generate a Quick Check MCQ per US-3.5 scaffolding framework.${imageContext}

ORIGINAL STUDENT QUESTION: "${input}"
Subject: ${curriculumContext.subject} | Class: ${curriculumContext.class}

**US-3.5 QUICK CHECK REQUIREMENTS:**
- FORMAT: One clear MCQ question with exactly 4 options (A, B, C, D)
- PURPOSE: Test understanding of the core concept from "${input}"${imageUrl ? ' and the uploaded image' : ''}
- TOPIC FOCUS: Must be directly related to "${input}"${imageUrl ? ' and the content visible in the image' : ''}

**OUTPUT FORMAT:**
Question: [Brief question about the concept${imageUrl ? ' shown in the image' : ''}]

A) [First option]
B) [Second option] 
C) [Third option]
D) [Fourth option]

Correct Answer: [A/B/C/D]
Explanation: [Brief explanation of why the correct answer is right]`;
  }

  buildTryItPrompt(input, imageUrl, curriculumContext, messageHistory) {
    const conversationContext = messageHistory.length > 0 
      ? `Previous conversation: ${messageHistory.slice(-3).map(m => `${m.sender}: ${m.content}`).join('\n')}`
      : '';

    const imageContext = imageUrl 
      ? `\n\n**IMAGE ANALYSIS REQUIRED:**
The student has uploaded an image. Please provide hints and guidance based on the content visible in the image. Focus on:
- What educational concepts are shown in the image
- Provide hints that help the student understand the image content
- Guide them through the problem or concept shown in the image`
      : '';

    // Build personalized context
    const personalizedContext = this.buildPersonalizedContext(curriculumContext);

    return `You are Geni Ma'am, a warm Indian tutor providing hints and examples to help the student understand the concept.

${conversationContext}

**HINT AND EXAMPLE REQUIREMENTS:**
- PEDAGOGICAL PURPOSE: Provide helpful hints and proper examples to help the student understand the concept from the conversation
- GUIDANCE LEVEL: Give clear examples and explanations that guide understanding without giving away the complete answer
- FORMAT: Focus on providing hints and examples that help the student grasp the concept
- TOPIC FOCUS: Must be directly related to the original question from the conversation${imageUrl ? ' and the uploaded image' : ''} - not a different topic

**PERSONALIZED CONTEXT:**
${personalizedContext}

Context Details:
Subject: ${curriculumContext.subject} (Class ${curriculumContext.class}) 
Topic: ${curriculumContext.subject}
Board: ${curriculumContext.board}
Language: ${curriculumContext.language === 'hi' ? 'Hindi' : curriculumContext.language === 'hinglish' ? 'Hinglish' : 'English'}

**LANGUAGE INSTRUCTIONS:**
${curriculumContext.language === 'hi' ? 'IMPORTANT: Respond entirely in Hindi (हिंदी). Use Devanagari script for all text.' : 
  curriculumContext.language === 'hinglish' ? 'IMPORTANT: Respond in Hinglish (mix of Hindi and English). Use both Devanagari script and English as appropriate.' : 
  'IMPORTANT: Respond in English.'}

**INDIAN CONTEXT REQUIREMENTS:**
- Use Indian names (like Priya, Arjun, Sita, Raj, etc.) in examples
- Use Indian cultural references and examples
- Make examples relevant to Indian students' experiences
- Use Indian currency (₹), measurements, and contexts${imageContext}

**OUTPUT FORMAT:**
Provide helpful hints and examples that guide the student's understanding of the concept from the conversation.
Include:
1. A helpful hint that points them in the right direction
2. A clear example that illustrates the concept
3. Encouraging guidance that builds their confidence

Focus on helping them understand the concept through hints and examples rather than giving them a practice problem.`;
  }

  buildRecapPrompt(input, imageUrl, curriculumContext, messageHistory) {
    const conversationContext = messageHistory.length > 0 
      ? `Previous conversation: ${messageHistory.slice(-3).map(m => `${m.sender}: ${m.content}`).join('\n')}`
      : '';

    const imageContext = imageUrl 
      ? `\n\n**IMAGE ANALYSIS REQUIRED:**
The student has uploaded an image. Please provide a summary that includes insights from the image. Focus on:
- What key concepts were shown in the image
- How the image content relates to the overall learning
- Summarize both the conversation and the image content`
      : '';

    return `You are Geni Ma'am, a warm Indian tutor. Generate a Recap section per US-3.5 scaffolding framework.

Context: Student asked: "${input}"
Subject: ${curriculumContext.subject} | Class: ${curriculumContext.class}

${conversationContext}${imageContext}

**US-3.5 RECAP REQUIREMENTS:**
- STRICT FORMAT: Exactly 2 lines maximum
- PURPOSE: Summarize key learning points from this session${imageUrl ? ' including insights from the uploaded image' : ''}
- TONE: Encouraging and consolidating

**OUTPUT FORMAT:**
Provide exactly 2 lines that recap the main learning points.
Line 1: Core concept summary${imageUrl ? ' (including image insights)' : ''}
Line 2: Practical application or significance

Keep it concise and encouraging.`;
  }

  buildMCQValidationPrompt(input, imageUrl, curriculumContext, messageHistory) {
    const lastAIMessage = messageHistory.filter(m => m.sender === 'ai').pop();
    const quickCheckContent = lastAIMessage ? lastAIMessage.content : '';

    const imageContext = imageUrl 
      ? `\n\n**IMAGE ANALYSIS REQUIRED:**
The student has uploaded an image. Please provide feedback that considers both their answer and the image content. Focus on:
- How their answer relates to what's shown in the image
- Whether they correctly understood the image content
- Provide feedback that connects their answer to the visual information`
      : '';

    return `You are Geni Ma'am validating a student's MCQ answer.

CONTEXT:
Student originally asked: "${input}"${imageContext}

QUICK CHECK QUESTION YOU ASKED:
${quickCheckContent}

STUDENT'S RESPONSE:
"${input}"

YOUR TASK:
Analyze the student's response against the quick check question and provide appropriate feedback:

1. If CORRECT: Provide encouraging feedback with brief explanation (≤50 words)
2. If INCORRECT: Show "⚠️ Common Mistake" warning, explain why their choice is wrong, and guide them to the correct understanding
3. If unclear: Provide constructive educational guidance about the concept${imageUrl ? ' and the image content' : ''}

You have the complete question context above - determine the correct answer based on the question content and validate accordingly.

Be warm, supportive, and educational. Keep response concise but informative.`;
  }

  buildAlternativeExplanationPrompt(input, imageUrl, curriculumContext, messageHistory) {
    const conversationContext = messageHistory.length > 0 
      ? `Previous conversation: ${messageHistory.slice(-3).map(m => `${m.sender}: ${m.content}`).join('\n')}`
      : '';

    const imageContext = imageUrl 
      ? `\n\n**IMAGE ANALYSIS REQUIRED:**
The student has uploaded an image. Please provide an alternative explanation that considers the image content. Focus on:
- What educational concepts are shown in the image
- Provide a different perspective or approach to understanding the image content
- Use the image as a visual aid in your alternative explanation`
      : '';

    // Build personalized context
    const personalizedContext = this.buildPersonalizedContext(curriculumContext);

    return `You are Geni Ma'am providing an alternative explanation because the student found the previous explanation unclear.

${conversationContext}

**ALTERNATIVE EXPLANATION REQUIREMENTS:**
- Provide a COMPLETELY DIFFERENT approach to explaining the same concept
- Use different analogies, examples, or teaching methods than before
- Make it longer and more detailed than the previous explanation
- Include multiple examples to illustrate the concept
- Use simpler language and break down complex ideas further
- Connect to the student's prior knowledge and experiences
- Focus on explaining in a different way with longer explanations and examples

**PERSONALIZED CONTEXT:**
${personalizedContext}

Context Details:
Subject: ${curriculumContext.subject} (Class ${curriculumContext.class}) 
Topic: ${curriculumContext.subject}
Board: ${curriculumContext.board}
Language: ${curriculumContext.language === 'hi' ? 'Hindi' : curriculumContext.language === 'hinglish' ? 'Hinglish' : 'English'}

**LANGUAGE INSTRUCTIONS:**
${curriculumContext.language === 'hi' ? 'IMPORTANT: Respond entirely in Hindi (हिंदी). Use Devanagari script for all text.' : 
  curriculumContext.language === 'hinglish' ? 'IMPORTANT: Respond in Hinglish (mix of Hindi and English). Use both Devanagari script and English as appropriate.' : 
  'IMPORTANT: Respond in English.'}

**INDIAN CONTEXT REQUIREMENTS:**
- Use Indian names (like Priya, Arjun, Sita, Raj, etc.) in examples
- Use Indian cultural references and examples
- Make examples relevant to Indian students' experiences
- Use Indian currency (₹), measurements, and contexts

**ALTERNATIVE EXPLANATION FORMAT:**
1. Start with a different analogy or real-world connection
2. Break down the concept into smaller, simpler parts
3. Provide 2-3 different examples to illustrate the same concept
4. Use visual descriptions or step-by-step breakdowns
5. Connect to everyday experiences the student can relate to
6. End with a summary that reinforces the main concept

Focus on making the explanation as clear and accessible as possible using a completely different approach than what was used before.${imageUrl ? ' Consider the uploaded image in your alternative explanation.' : ''}`;
  }

  // Get section title with emojis
  getSectionTitle(sectionType) {
    const titles = {
      [this.sectionTypes.BIG_IDEA]: '🧠 Big Idea',
      [this.sectionTypes.EXAMPLE]: '📚 Step-by-Step Example',
      [this.sectionTypes.QUICK_CHECK]: '❓ Quick Check',
      [this.sectionTypes.TRY_IT]: '🎯 Try It Yourself',
      [this.sectionTypes.RECAP]: '📌 Recap',
      [this.sectionTypes.MCQ_VALIDATION]: '✅ Answer Review',
      [this.sectionTypes.ALTERNATIVE_EXPLANATION]: '🔄 Alternative Explanation'
    };
    return titles[sectionType] || '💬 Response';
  }

  // Get max tokens for each section type
  getMaxTokensForSection(sectionType) {
    const tokenLimits = {
      [this.sectionTypes.BIG_IDEA]: 3000,
      [this.sectionTypes.EXAMPLE]: 4000,
      [this.sectionTypes.QUICK_CHECK]: 2000,
      [this.sectionTypes.TRY_IT]: 3000,
      [this.sectionTypes.RECAP]: 1500,
      [this.sectionTypes.MCQ_VALIDATION]: 2000,
      [this.sectionTypes.ALTERNATIVE_EXPLANATION]: 4000
    };
    return tokenLimits[sectionType] || 3000;
  }
}
