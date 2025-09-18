import { NextResponse } from 'next/server';
import { OrchestratorEngine } from '../../../../lib/orchestrator/OrchestratorEngine.js';

const orchestrator = new OrchestratorEngine();

export async function POST(request) {
  try {
    const { sessionId, questionId, selectedAnswer } = await request.json();

    if (!sessionId || !questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: 'Session ID, question ID, and selected answer are required' },
        { status: 400 }
      );
    }

    const result = await orchestrator.validateMCQAnswer(sessionId, questionId, selectedAnswer);

    return NextResponse.json({
      success: true,
      isCorrect: result.isCorrect,
      explanation: result.explanation,
      nextAction: result.nextAction
    });
  } catch (error) {
    console.error('MCQ validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate MCQ answer' },
      { status: 500 }
    );
  }
}
