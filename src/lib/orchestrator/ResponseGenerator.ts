import OpenAI from 'openai';
import type { 
  TutoringContext, 
  TutoringSection, 
  SectionType, 
  Step, 
  MCQOption, 
  Hint,
  StudentInput,
  DoubtType 
} from './types';

export class ScaffoldedResponseGenerator {
  private openai: OpenAI;
  private readonly MAX_TOKENS_PER_RESPONSE = 2000;
  private readonly MAX_STEPS_PER_SECTION = 5;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateSection(
    sectionType: SectionType,
    context: TutoringContext,
    studentInput: StudentInput,
    doubtType: DoubtType
  ): Promise<TutoringSection> {
    try {
      const prompt = this.buildSectionPrompt(sectionType, context, studentInput, doubtType);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: this.MAX_TOKENS_PER_RESPONSE
      });

      const content = response.choices[0].message.content || '';
      return this.parseSectionResponse(sectionType, content, context);
    } catch (error) {
      console.error('Error generating section:', error);
      return this.getFallbackSection(sectionType, context, studentInput);
    }
  }

  private buildSectionPrompt(
    sectionType: SectionType,
    context: TutoringContext,
    studentInput: StudentInput,
    doubtType: DoubtType
  ): string {
    const basePrompt = this.getBasePrompt(context, studentInput, doubtType);
    const sectionSpecificPrompt = this.getSectionSpecificPrompt(sectionType);
    
    return `${basePrompt}\n\n${sectionSpecificPrompt}`;
  }

  private getBasePrompt(
    context: TutoringContext,
    studentInput: StudentInput,
    doubtType: DoubtType
  ): string {
    const userProfile = context.userProfile;
    const grade = userProfile?.grade || 'general';
    const language = userProfile?.preferences?.language || 'en';
    
    return `
You are Geni Ma'am, an expert AI tutor specializing in personalized education for students.

Student Context:
- Grade: ${grade}
- Language: ${language}
- Subject: ${context.subject || 'general'}
- Doubt Type: ${doubtType.type} (confidence: ${doubtType.confidence})
- Previous conversation: ${context.conversationHistory.slice(-3).map(m => m.content).join(' ')}

Current Student Input: "${studentInput.text}"

Instructions:
- Be encouraging, patient, and supportive
- Use age-appropriate language and examples
- Break down complex concepts into simple steps
- Provide clear explanations with examples
- Encourage critical thinking
- Use the student's preferred language (${language})
- Make learning fun and engaging
`;
  }

  private getSectionSpecificPrompt(sectionType: SectionType): string {
    switch (sectionType) {
      case 'probe':
        return `
Generate a PROBE section that:
- Asks clarifying questions to understand the student's current knowledge
- Identifies specific areas of confusion
- Gathers information about what the student already knows
- Format: Ask 2-3 thoughtful questions
- Keep it conversational and encouraging
`;
      
      case 'big_idea':
        return `
Generate a BIG IDEA section that:
- Explains the core concept in simple terms
- Uses analogies and real-world examples
- Connects to the student's grade level
- Format: Clear explanation with 1-2 examples
- Make it memorable and easy to understand
`;
      
      case 'example':
        return `
Generate an EXAMPLE section that:
- Provides a step-by-step worked example
- Shows the complete solution process
- Explains each step clearly
- Format: Detailed example with explanations
- Use the student's grade-appropriate level
`;
      
      case 'quick_check':
        return `
Generate a QUICK CHECK section that:
- Tests understanding of the concept
- Asks a simple question or problem
- Provides immediate feedback
- Format: One question with explanation
- Keep it simple and encouraging
`;
      
      case 'try_it':
        return `
Generate a TRY IT section that:
- Gives the student a problem to solve
- Provides hints if needed
- Encourages independent thinking
- Format: Problem statement with guidance
- Make it challenging but achievable
`;
      
      case 'recap':
        return `
Generate a RECAP section that:
- Summarizes key points learned
- Reinforces the main concept
- Suggests next steps or practice
- Format: Summary with encouragement
- End on a positive note
`;
      
      case 'mcq':
        return `
Generate an MCQ section that:
- Creates 4 multiple choice options
- Has one correct answer with explanation
- Includes 2-3 plausible distractors
- Format: Question with 4 options (A, B, C, D)
- Provide explanation for the correct answer
`;
      
      case 'hint':
        return `
Generate a HINT section that:
- Provides progressive hints (3 levels)
- Guides without giving away the answer
- Encourages problem-solving
- Format: 3 hints of increasing specificity
- Build confidence step by step
`;
      
      default:
        return `
Generate a helpful response that:
- Addresses the student's question directly
- Provides clear explanations
- Uses appropriate examples
- Encourages further learning
`;
    }
  }

  private parseSectionResponse(
    sectionType: SectionType,
    content: string,
    context: TutoringContext
  ): TutoringSection {
    const sectionId = this.generateSectionId();
    const steps = this.extractSteps(content, sectionType);
    const mcqOptions = sectionType === 'mcq' ? this.extractMCQOptions(content) : undefined;
    const hints = sectionType === 'hint' ? this.extractHints(content) : undefined;

    return {
      id: sectionId,
      type: sectionType,
      title: this.generateSectionTitle(sectionType),
      content: this.cleanContent(content),
      steps,
      mcqOptions,
      hints,
      isCompleted: false,
      createdAt: new Date()
    };
  }

  private extractSteps(content: string, sectionType: SectionType): Step[] {
    const steps: Step[] = [];
    
    // Look for numbered steps or bullet points
    const stepPatterns = [
      /(\d+\.\s+[^\n]+)/g,
      /(•\s+[^\n]+)/g,
      /(-\s+[^\n]+)/g
    ];

    let stepTexts: string[] = [];
    
    for (const pattern of stepPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        stepTexts = matches.map(match => match.replace(/^\d+\.\s*|^[•-]\s*/, ''));
        break;
      }
    }

    // If no structured steps found, create steps from paragraphs
    if (stepTexts.length === 0) {
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      stepTexts = paragraphs.slice(0, this.MAX_STEPS_PER_SECTION);
    }

    // Create step objects
    stepTexts.forEach((text, index) => {
      if (index < this.MAX_STEPS_PER_SECTION) {
        steps.push({
          id: `${Date.now()}-step-${index}`,
          content: text.trim(),
          isCompleted: false,
          order: index + 1
        });
      }
    });

    return steps;
  }

  private extractMCQOptions(content: string): MCQOption[] {
    const options: MCQOption[] = [];
    
    // Look for A), B), C), D) patterns
    const optionPattern = /([A-D])\)\s*([^\n]+)/g;
    let match;
    
    while ((match = optionPattern.exec(content)) !== null) {
      const letter = match[1];
      const text = match[2].trim();
      
      options.push({
        id: `option-${letter.toLowerCase()}`,
        text,
        isCorrect: false // Will be determined by AI or manual review
      });
    }

    // If no structured options found, create from content
    if (options.length === 0) {
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      const optionLines = lines.filter(line => 
        line.match(/^[A-D][\.\)]\s+/) || 
        line.match(/^[1-4][\.\)]\s+/)
      );
      
      optionLines.forEach((line, index) => {
        if (index < 4) {
          const text = line.replace(/^[A-D1-4][\.\)]\s+/, '').trim();
          options.push({
            id: `option-${index + 1}`,
            text,
            isCorrect: false
          });
        }
      });
    }

    return options;
  }

  private extractHints(content: string): Hint[] {
    const hints: Hint[] = [];
    
    // Look for hint patterns
    const hintPatterns = [
      /(Hint \d+[:\-]\s*[^\n]+)/gi,
      /(Level \d+[:\-]\s*[^\n]+)/gi,
      /(\d+\.\s*[^\n]+)/g
    ];

    let hintTexts: string[] = [];
    
    for (const pattern of hintPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        hintTexts = matches.map(match => 
          match.replace(/^(Hint|Level)\s*\d+[:\-]\s*|\d+\.\s*/, '').trim()
        );
        break;
      }
    }

    // Create hint objects
    hintTexts.forEach((text, index) => {
      if (index < 3) { // Maximum 3 hints
        hints.push({
          id: `hint-${index + 1}`,
          level: index + 1,
          content: text,
          isRevealed: false
        });
      }
    });

    return hints;
  }

  private generateSectionId(): string {
    return `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSectionTitle(sectionType: SectionType): string {
    const titles: Record<SectionType, string> = {
      probe: 'Let\'s Understand Your Question',
      big_idea: 'The Big Idea',
      example: 'Let\'s Work Through an Example',
      quick_check: 'Quick Check',
      try_it: 'Your Turn to Try',
      recap: 'What We Learned',
      mcq: 'Test Your Understanding',
      hint: 'Helpful Hints'
    };
    
    return titles[sectionType] || 'Learning Section';
  }

  private cleanContent(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/\s{2,}/g, ' '); // Remove excessive spaces
      // Removed .trim() to preserve leading/trailing whitespace in bot messages
  }

  private getFallbackSection(
    sectionType: SectionType,
    context: TutoringContext,
    studentInput: StudentInput
  ): TutoringSection {
    const fallbackContent = this.getFallbackContent(sectionType, studentInput);
    
    return {
      id: this.generateSectionId(),
      type: sectionType,
      title: this.generateSectionTitle(sectionType),
      content: fallbackContent,
      steps: [{
        id: 'fallback-step-1',
        content: fallbackContent,
        isCompleted: false,
        order: 1
      }],
      isCompleted: false,
      createdAt: new Date()
    };
  }

  private getFallbackContent(sectionType: SectionType, studentInput: StudentInput): string {
    const fallbacks: Record<SectionType, string> = {
      probe: `I'd love to help you with "${studentInput.text}". Can you tell me more about what specific part you're finding challenging?`,
      big_idea: `Let me explain this concept in a simple way. The key idea here is to break it down into smaller, manageable parts.`,
      example: `Let me show you how to work through this step by step. First, we'll identify what we know, then apply the right method.`,
      quick_check: `Let's make sure you understand this concept. Can you explain it back to me in your own words?`,
      try_it: `Now it's your turn! Try to solve this problem using what we've learned. I'm here to help if you get stuck.`,
      recap: `Great job! Let's review what we learned today. The main concept was [concept], and you did a wonderful job understanding it.`,
      mcq: `Let's test your understanding with a quick question. Choose the best answer and I'll explain why it's correct.`,
      hint: `Here are some helpful hints to guide you: 1) Think about what you already know, 2) Break it into smaller steps, 3) Don't be afraid to ask for help.`
    };
    
    return fallbacks[sectionType] || `I'm here to help you learn! Let's work through "${studentInput.text}" together.`;
  }
}
