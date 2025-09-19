
import { connectDB } from '../../../lib/mongodb';
import ChatSessionNew from '../../../models/ChatSessionNew';
import { ChatMessage } from '../../../models/ChatMessage';
import { UserStats } from '../../../models/UserStats';
import { User } from '../../../models/User';
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
- You use Indian names, places, and cultural references in your examples
- You adapt your explanations to the student's grade level, board, and learning preferences
- You provide clear, educational explanations with appropriate scaffolding

**INDIAN CONTEXT GUIDELINES:**
- Always use Indian names (Priya, Arjun, Sita, Raj, Ananya, etc.) in examples
- Reference Indian cities and states (Delhi, Mumbai, Bangalore, Chennai, etc.)
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
      MCQ_VALIDATION: 'mcq_validation'
    };
  }

  async processStudentInput(sessionId, studentInput, onEvent) {
    try {
      console.log('[SimpleOrchestrator] Processing student input:', { sessionId, studentInput });
      
      // Get or create session
      let session = await this.getSession(sessionId);
      if (!session) {
        console.log('[SimpleOrchestrator] Creating new session');
        session = await this.createSession(studentInput.userId, studentInput.subject);
      }

      // Add user message
      console.log('[SimpleOrchestrator] Adding user message');
      await this.addMessage({
        sessionId: session._id.toString(),
        userId: studentInput.userId,
        sender: 'user',
        messageType: studentInput.type,
        content: studentInput.text,
        imageUrl: studentInput.imageUrl
      });

      // Get conversation context
      console.log('[SimpleOrchestrator] Building tutoring context');
      const context = await this.buildTutoringContext(session, studentInput);
      
      // Determine which section to generate based on intent
      console.log('[SimpleOrchestrator] Determining section type');
      const sectionType = this.determineSectionByIntent(context);
      console.log('[SimpleOrchestrator] Section type determined:', sectionType);
      
      // Generate appropriate section
      console.log('[SimpleOrchestrator] Generating section content');
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
        sessionId: session._id.toString(),
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
          sessionId: session._id.toString()
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
          sessionId: session._id.toString()
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
      return await ChatSessionNew.findById(sessionId);
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async createSession(userId, subject = 'general') {
    try {
      await connectDB();
      
      const session = new ChatSessionNew({
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
      await ChatSessionNew.findByIdAndUpdate(messageData.sessionId, {
        $inc: { messageCount: 1 },
        lastActive: new Date()
      });

      // Update user stats
      await this.updateMessageStats(messageData.userId, messageData.messageType);

      return {
        id: savedMessage._id.toString(),
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
      const messages = await this.getRecentMessages(session._id.toString(), 10);
      
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
        max_tokens: 1000
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
      
      const messages = await ChatMessage.find({ sessionId })
        .sort({ createdAt: -1 })
        .limit(limit);

      return messages.map(msg => ({
        id: msg._id.toString(),
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
      console.log('[SimpleOrchestrator] Building tutoring context for session:', session._id);
      const messages = await ChatMessage.find({ sessionId: session._id })
        .sort({ timestamp: 1 })
        .limit(10); // Last 10 messages for context

      console.log('[SimpleOrchestrator] Found messages:', messages.length);

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
          console.log('[SimpleOrchestrator] User profile found:', userProfile ? 'Yes' : 'No');
        }
      } catch (profileError) {
        console.error('[SimpleOrchestrator] Error fetching user profile:', profileError);
      }

      // Build personalized curriculum context
      const curriculumContext = {
        subject: session.subject || 'general',
        class: userProfile?.grade?.toString() || '10',
        board: userProfile?.board || 'CBSE',
        language: userProfile?.langPref || 'en',
        learningStyle: userProfile?.learningStyle || 'Text',
        pace: userProfile?.pace || 'Normal',
        state: userProfile?.state || '',
        city: userProfile?.city || '',
        role: userProfile?.role || 'student',
        ageBand: userProfile?.ageBand || '11-14'
      };

      return {
        sessionId: session._id.toString(),
        userId: studentInput.userId,
        subject: session.subject || 'general',
        currentInput: studentInput.text,
        currentImageUrl: studentInput.imageUrl, // Include image data
        messageHistory: messages,
        curriculumContext: curriculumContext,
        userProfile: userProfile // Include full user profile for advanced personalization
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
    
    console.log('[SimpleOrchestrator] Determining section for input:', latestInput);
    
    // Check if this is an MCQ response
    if (this.isMCQResponse(latestInput)) {
      console.log('[SimpleOrchestrator] Detected MCQ response');
      return this.sectionTypes.MCQ_VALIDATION;
    }
    
    // Check if user confirmed understanding
    if (this.userConfirmedUnderstanding(latestInput)) {
      console.log('[SimpleOrchestrator] Detected understanding confirmation');
      return this.sectionTypes.RECAP;
    }
    
    // Check if this is an initial question (no previous AI messages)
    const hasAIMessages = messageHistory.some(msg => msg.sender === 'ai');
    if (!hasAIMessages) {
      console.log('[SimpleOrchestrator] Detected initial question');
      return this.sectionTypes.BIG_IDEA;
    }
    
    // Check for specific requests
    if (this.isExampleRequest(latestInput)) {
      console.log('[SimpleOrchestrator] Detected example request');
      return this.sectionTypes.EXAMPLE;
    }
    
    if (this.isStepsRequest(latestInput)) {
      console.log('[SimpleOrchestrator] Detected steps request');
      return this.sectionTypes.EXAMPLE;
    }
    
    if (this.isHintRequest(latestInput)) {
      console.log('[SimpleOrchestrator] Detected hint request');
      return this.sectionTypes.TRY_IT;
    }
    
    // Default to Big Idea for new concepts
    console.log('[SimpleOrchestrator] Defaulting to Big Idea');
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
    const result = /^(steps|step by step|detailed steps|show steps|show detailed steps|how to|process|procedure|break it down|explain step by step|walk me through)/i.test(input);
    console.log('[SimpleOrchestrator] isStepsRequest check:', { input, result });
    return result;
  }

  isHintRequest(input) {
    const result = /^(hint|help|not clear|confused|don't understand)/i.test(input);
    console.log('[SimpleOrchestrator] isHintRequest check:', { input, result });
    return result;
  }

  // Generate section content based on type
  async generateSection(sectionType, context) {
    try {
      console.log('[SimpleOrchestrator] Building prompt for section:', sectionType);
      const prompt = this.buildSectionPrompt(sectionType, context);
      console.log('[SimpleOrchestrator] Prompt built, length:', prompt.length);
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
      }
      
      console.log('[SimpleOrchestrator] Calling OpenAI API');
      
      // Prepare messages array
      const messages = [
        { role: 'system', content: this.systemPrompt }
      ];

      // Check if we have an image to analyze
      if (context.currentImageUrl) {
        console.log('[SimpleOrchestrator] Image detected, using vision model');
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

      console.log('[SimpleOrchestrator] OpenAI response received');
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
        return this.buildTryItPrompt(currentInput, currentImageUrl, curriculumContext);
      
      case this.sectionTypes.RECAP:
        return this.buildRecapPrompt(currentInput, currentImageUrl, curriculumContext, messageHistory);
      
      case this.sectionTypes.MCQ_VALIDATION:
        return this.buildMCQValidationPrompt(currentInput, currentImageUrl, curriculumContext, messageHistory);
      
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

    return `You are Geni Ma'am, a warm Indian tutor. Generate a Big Idea section per US-3.5 scaffolding framework.

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

**INDIAN CONTEXT REQUIREMENTS:**
- Use Indian names (like Priya, Arjun, Sita, Raj, etc.) in examples
- Reference Indian places (like Delhi, Mumbai, Bangalore, Chennai, etc.)
- Use Indian cultural references and examples
- Make examples relevant to Indian students' experiences
- Use Indian currency (₹), measurements, and contexts

**OUTPUT FORMAT:**
Provide clear, concise explanation of the core concept in exactly 120 words or fewer. Focus on:
1. Main concept definition  
2. Why it matters
3. One concrete real-world relevant example with Indian context
4. Connection to student's question${imageUrl ? ' and the uploaded image' : ''}`;
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

    return `You are Geni Ma'am. Here's the complete conversation context:

${conversationContext}

EXAMPLE SECTION (3-5 numbered steps): Provide a ${isDetailedStepsRequest ? 'detailed, comprehensive' : 'clear'} step-by-step example based on the complete conversation history.${imageContext}

**PERSONALIZED CONTEXT:**
${personalizedContext}

Context Details:
Subject: ${curriculumContext.subject} (Class ${curriculumContext.class}) 
Topic: ${curriculumContext.subject}
Board: ${curriculumContext.board}
Language: ${curriculumContext.language === 'hi' ? 'Hindi' : curriculumContext.language === 'hinglish' ? 'Hinglish' : 'English'}

**INDIAN CONTEXT REQUIREMENTS:**
- Use Indian names (like Priya, Arjun, Sita, Raj, etc.) in examples
- Reference Indian places (like Delhi, Mumbai, Bangalore, Chennai, etc.)
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

  buildTryItPrompt(input, imageUrl, curriculumContext) {
    const imageContext = imageUrl 
      ? `\n\n**IMAGE ANALYSIS REQUIRED:**
The student has uploaded an image. Please provide hints and guidance based on the content visible in the image. Focus on:
- What educational concepts are shown in the image
- Provide hints that help the student understand the image content
- Guide them through the problem or concept shown in the image`
      : '';

    return `You are Geni Ma'am, a warm Indian tutor. Generate a Try It section per US-3.5 scaffolding framework.${imageContext}

ORIGINAL STUDENT QUESTION: "${input}"
Subject: ${curriculumContext.subject} | Class: ${curriculumContext.class}

**US-3.5 TRY IT REQUIREMENTS:**
- PEDAGOGICAL PURPOSE: Give student chance to practice the concept independently
- GUIDANCE LEVEL: Provide encouragement but let them think for themselves
- FORMAT: Clear practice prompt with supportive tone
- TOPIC FOCUS: Must be directly related to "${input}"${imageUrl ? ' and the uploaded image' : ''} - not a different topic

**OUTPUT FORMAT:**
Provide encouraging practice prompt about "${input}"${imageUrl ? ' and the content in the image' : ''} that motivates the student to try applying this specific concept.
Keep it concise and supportive.

Focus on building confidence and independent application of "${input}"${imageUrl ? ' based on what they see in the image' : ''}.`;
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

  // Get section title with emojis
  getSectionTitle(sectionType) {
    const titles = {
      [this.sectionTypes.BIG_IDEA]: '🧠 Big Idea',
      [this.sectionTypes.EXAMPLE]: '📚 Step-by-Step Example',
      [this.sectionTypes.QUICK_CHECK]: '❓ Quick Check',
      [this.sectionTypes.TRY_IT]: '🎯 Try It Yourself',
      [this.sectionTypes.RECAP]: '📌 Recap',
      [this.sectionTypes.MCQ_VALIDATION]: '✅ Answer Review'
    };
    return titles[sectionType] || '💬 Response';
  }

  // Get max tokens for each section type
  getMaxTokensForSection(sectionType) {
    const tokenLimits = {
      [this.sectionTypes.BIG_IDEA]: 200,
      [this.sectionTypes.EXAMPLE]: 400,
      [this.sectionTypes.QUICK_CHECK]: 300,
      [this.sectionTypes.TRY_IT]: 200,
      [this.sectionTypes.RECAP]: 100,
      [this.sectionTypes.MCQ_VALIDATION]: 150
    };
    return tokenLimits[sectionType] || 300;
  }
}
