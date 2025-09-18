// Core types for the tutoring orchestrator system

export interface TutoringContext {
  sessionId: string;
  userId: string;
  subject?: string;
  grade?: string;
  language: 'en' | 'hi' | 'hinglish';
  currentSection?: TutoringSection;
  previousSections: TutoringSection[];
  userProfile?: UserProfile;
  conversationHistory: Message[];
}

export interface StudentInput {
  text: string;
  type: 'text' | 'voice' | 'image';
  imageUrl?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TutoringSection {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  steps: Step[];
  mcqOptions?: MCQOption[];
  hints?: Hint[];
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export type SectionType = 
  | 'probe'
  | 'big_idea'
  | 'example'
  | 'quick_check'
  | 'try_it'
  | 'recap'
  | 'mcq'
  | 'hint';

export interface Step {
  id: string;
  content: string;
  isCompleted: boolean;
  order: number;
}

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Hint {
  id: string;
  level: number;
  content: string;
  isRevealed: boolean;
}

export interface Message {
  id: string;
  sessionId: string;
  userId: string;
  sender: 'user' | 'ai';
  type: 'text' | 'voice' | 'image';
  content: string;
  imageUrl?: string;
  sectionId?: string;
  stepId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'parent' | 'teacher';
  grade?: string;
  school?: string;
  preferences: {
    language: 'en' | 'hi' | 'hinglish';
    notifications: boolean;
  };
  learningStats: {
    totalSessions: number;
    totalMessages: number;
    favoriteSubject?: string;
    lastActive: Date;
  };
}

export interface CurriculumEnvelope {
  subject: string;
  grade: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  learningObjectives: string[];
  prerequisites: string[];
}

export interface DoubtType {
  type: 'conceptual' | 'procedural' | 'application' | 'calculation';
  confidence: number;
  keywords: string[];
}

export interface ConfidenceScores {
  subject: number;
  topic: number;
  difficulty: number;
  overall: number;
}

// SSE Event types for real-time streaming
export interface SolveEvent {
  type: 'section' | 'step' | 'token' | 'final' | 'error' | 'mcq' | 'hint';
  data: any;
  timestamp: Date;
  sessionId: string;
}

export interface SectionEvent extends SolveEvent {
  type: 'section';
  data: {
    section: TutoringSection;
    isComplete: boolean;
  };
}

export interface TokenEvent extends SolveEvent {
  type: 'token';
  data: {
    token: string;
    sectionId: string;
    stepId?: string;
  };
}

export interface FinalEvent extends SolveEvent {
  type: 'final';
  data: {
    section: TutoringSection;
    nextAction?: string;
    performance: {
      ttft: number; // Time to First Token
      totalTime: number;
      tokensGenerated: number;
    };
  };
}

export interface ErrorEvent extends SolveEvent {
  type: 'error';
  data: {
    error: string;
    code: string;
    retryable: boolean;
  };
}

export interface MCQEvent extends SolveEvent {
  type: 'mcq';
  data: {
    question: string;
    options: MCQOption[];
    correctAnswer?: string;
    explanation?: string;
  };
}

export interface HintEvent extends SolveEvent {
  type: 'hint';
  data: {
    hint: Hint;
    remainingHints: number;
  };
}

// Performance tracking types
export interface PerformanceMetrics {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  ttft: number; // Time to First Token
  totalTime: number;
  tokensGenerated: number;
  sectionsCompleted: number;
  errors: number;
  retries: number;
}

// Configuration types
export interface OrchestratorConfig {
  maxSectionsPerSession: number;
  maxStepsPerSection: number;
  maxTokensPerResponse: number;
  timeoutMs: number;
  enableStreaming: boolean;
  enableOfflineMode: boolean;
  modelRouting: {
    primary: string;
    fallback: string;
  };
}
