import OpenAI from 'openai';
import type { StudentInput, TutoringContext, DoubtType, ConfidenceScores } from './types';

export class SubjectDetectionService {
  private openai: OpenAI;
  private subjectKeywords: Map<string, string[]> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.initializeSubjectKeywords();
  }

  async detectSubject(input: StudentInput, context: TutoringContext): Promise<{
    subject: string;
    topic: string;
    doubtType: DoubtType;
    confidence: ConfidenceScores;
    language: 'en' | 'hi' | 'hinglish';
  }> {
    try {
      // First try rule-based detection for quick response
      const ruleBasedResult = this.ruleBasedDetection(input.text);
      if (ruleBasedResult.confidence.overall > 0.7) {
        return ruleBasedResult;
      }

      // Fall back to AI-powered detection
      return await this.aiBasedDetection(input, context);
    } catch (error) {
      console.error('Error in subject detection:', error);
      // Return safe fallback
      return {
        subject: 'general',
        topic: 'general',
        doubtType: { type: 'conceptual', confidence: 0.5, keywords: [] },
        confidence: { subject: 0.5, topic: 0.5, difficulty: 0.5, overall: 0.5 },
        language: 'en'
      };
    }
  }

  private ruleBasedDetection(text: string): {
    subject: string;
    topic: string;
    doubtType: DoubtType;
    confidence: ConfidenceScores;
    language: 'en' | 'hi' | 'hinglish';
  } {
    const lowerText = text.toLowerCase();
    let subject = 'general';
    let topic = 'general';
    let confidence = 0.5;

    // Math detection
    if (this.containsMathKeywords(lowerText)) {
      subject = 'mathematics';
      topic = this.detectMathTopic(lowerText);
      confidence = 0.8;
    }
    // Science detection
    else if (this.containsScienceKeywords(lowerText)) {
      subject = 'science';
      topic = this.detectScienceTopic(lowerText);
      confidence = 0.8;
    }
    // English detection
    else if (this.containsEnglishKeywords(lowerText)) {
      subject = 'english';
      topic = this.detectEnglishTopic(lowerText);
      confidence = 0.7;
    }

    const doubtType = this.detectDoubtType(text);
    const language = this.detectLanguage(text);

    return {
      subject,
      topic,
      doubtType,
      confidence: {
        subject: confidence,
        topic: confidence * 0.9,
        difficulty: 0.5,
        overall: confidence
      },
      language
    };
  }

  private async aiBasedDetection(input: StudentInput, context: TutoringContext): Promise<{
    subject: string;
    topic: string;
    doubtType: DoubtType;
    confidence: ConfidenceScores;
    language: 'en' | 'hi' | 'hinglish';
  }> {
    const prompt = `
Analyze the following student input and determine:
1. Subject (mathematics, science, english, social studies, etc.)
2. Specific topic within that subject
3. Type of doubt (conceptual, procedural, application, calculation)
4. Confidence scores for each detection
5. Language used (en, hi, hinglish)

Student input: "${input.text}"
Previous context: ${context.conversationHistory.slice(-3).map(m => m.content).join(' ')}

Respond in JSON format:
{
  "subject": "string",
  "topic": "string", 
  "doubtType": {
    "type": "conceptual|procedural|application|calculation",
    "confidence": 0.0-1.0,
    "keywords": ["keyword1", "keyword2"]
  },
  "confidence": {
    "subject": 0.0-1.0,
    "topic": 0.0-1.0,
    "difficulty": 0.0-1.0,
    "overall": 0.0-1.0
  },
  "language": "en|hi|hinglish"
}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        subject: result.subject || 'general',
        topic: result.topic || 'general',
        doubtType: result.doubtType || { type: 'conceptual', confidence: 0.5, keywords: [] },
        confidence: result.confidence || { subject: 0.5, topic: 0.5, difficulty: 0.5, overall: 0.5 },
        language: result.language || 'en'
      };
    } catch (error) {
      console.error('AI detection failed:', error);
      return this.ruleBasedDetection(input.text);
    }
  }

  private containsMathKeywords(text: string): boolean {
    const mathKeywords = [
      'solve', 'equation', 'algebra', 'geometry', 'calculus', 'trigonometry',
      'fraction', 'decimal', 'percentage', 'ratio', 'proportion', 'angle',
      'triangle', 'circle', 'square', 'rectangle', 'area', 'perimeter',
      'volume', 'graph', 'function', 'derivative', 'integral', 'limit',
      'quadratic', 'polynomial', 'matrix', 'vector', 'probability', 'statistics'
    ];
    
    return mathKeywords.some(keyword => text.includes(keyword));
  }

  private containsScienceKeywords(text: string): boolean {
    const scienceKeywords = [
      'physics', 'chemistry', 'biology', 'atom', 'molecule', 'cell',
      'force', 'energy', 'motion', 'gravity', 'electricity', 'magnetism',
      'reaction', 'compound', 'element', 'periodic', 'evolution', 'genetics',
      'ecosystem', 'photosynthesis', 'respiration', 'digestion', 'circulation',
      'experiment', 'hypothesis', 'theory', 'law', 'observation', 'data'
    ];
    
    return scienceKeywords.some(keyword => text.includes(keyword));
  }

  private containsEnglishKeywords(text: string): boolean {
    const englishKeywords = [
      'grammar', 'sentence', 'paragraph', 'essay', 'poem', 'story',
      'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition',
      'conjunction', 'interjection', 'tense', 'voice', 'mood', 'figure',
      'literature', 'author', 'character', 'plot', 'theme', 'setting',
      'comprehension', 'vocabulary', 'spelling', 'punctuation', 'writing'
    ];
    
    return englishKeywords.some(keyword => text.includes(keyword));
  }

  private detectMathTopic(text: string): string {
    if (text.includes('algebra') || text.includes('equation')) return 'algebra';
    if (text.includes('geometry') || text.includes('angle') || text.includes('triangle')) return 'geometry';
    if (text.includes('calculus') || text.includes('derivative') || text.includes('integral')) return 'calculus';
    if (text.includes('fraction') || text.includes('decimal')) return 'fractions_decimals';
    if (text.includes('percentage') || text.includes('ratio')) return 'percentages_ratios';
    if (text.includes('probability') || text.includes('statistics')) return 'probability_statistics';
    return 'general_math';
  }

  private detectScienceTopic(text: string): string {
    if (text.includes('physics') || text.includes('force') || text.includes('energy')) return 'physics';
    if (text.includes('chemistry') || text.includes('atom') || text.includes('molecule')) return 'chemistry';
    if (text.includes('biology') || text.includes('cell') || text.includes('organism')) return 'biology';
    return 'general_science';
  }

  private detectEnglishTopic(text: string): string {
    if (text.includes('grammar') || text.includes('sentence')) return 'grammar';
    if (text.includes('literature') || text.includes('poem') || text.includes('story')) return 'literature';
    if (text.includes('writing') || text.includes('essay')) return 'writing';
    if (text.includes('vocabulary') || text.includes('spelling')) return 'vocabulary';
    return 'general_english';
  }

  private detectDoubtType(text: string): DoubtType {
    const lowerText = text.toLowerCase();
    
    // Conceptual doubts
    if (lowerText.includes('what is') || lowerText.includes('explain') || lowerText.includes('why')) {
      return { type: 'conceptual', confidence: 0.8, keywords: ['concept', 'understanding'] };
    }
    
    // Procedural doubts
    if (lowerText.includes('how to') || lowerText.includes('steps') || lowerText.includes('process')) {
      return { type: 'procedural', confidence: 0.8, keywords: ['steps', 'procedure', 'method'] };
    }
    
    // Application doubts
    if (lowerText.includes('solve') || lowerText.includes('find') || lowerText.includes('calculate')) {
      return { type: 'application', confidence: 0.7, keywords: ['solve', 'apply', 'calculate'] };
    }
    
    // Calculation doubts
    if (lowerText.includes('answer') || lowerText.includes('result') || lowerText.includes('value')) {
      return { type: 'calculation', confidence: 0.6, keywords: ['calculation', 'computation'] };
    }
    
    return { type: 'conceptual', confidence: 0.5, keywords: [] };
  }

  private detectLanguage(text: string): 'en' | 'hi' | 'hinglish' {
    // Simple language detection based on character patterns
    const hindiChars = /[\u0900-\u097F]/;
    const hasHindi = hindiChars.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    
    if (hasHindi && hasEnglish) {
      return 'hinglish';
    } else if (hasHindi) {
      return 'hi';
    } else {
      return 'en';
    }
  }

  private initializeSubjectKeywords(): void {
    this.subjectKeywords.set('mathematics', [
      'algebra', 'geometry', 'calculus', 'trigonometry', 'statistics', 'probability',
      'arithmetic', 'fractions', 'decimals', 'percentages', 'ratios', 'proportions'
    ]);
    
    this.subjectKeywords.set('science', [
      'physics', 'chemistry', 'biology', 'earth science', 'environmental science',
      'astronomy', 'geology', 'botany', 'zoology', 'anatomy', 'physiology'
    ]);
    
    this.subjectKeywords.set('english', [
      'grammar', 'literature', 'writing', 'reading', 'vocabulary', 'spelling',
      'comprehension', 'essay', 'poetry', 'prose', 'drama', 'fiction'
    ]);
    
    this.subjectKeywords.set('social studies', [
      'history', 'geography', 'civics', 'economics', 'political science',
      'sociology', 'anthropology', 'psychology', 'philosophy'
    ]);
  }
}
