import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  try {
    const { subject, originalQuestion, context } = await request.json();

    if (!originalQuestion) {
      return NextResponse.json(
        { error: 'Original question is required' },
        { status: 400 }
      );
    }

    // Create a contextual quiz generation prompt
    const prompt = `You are Geni Ma'am, a warm Indian tutor. Generate a contextual quiz question based on the student's original question.

STUDENT'S ORIGINAL QUESTION: "${originalQuestion}"
SUBJECT: ${subject || 'general'}
CONTEXT: ${context || 'No additional context'}

**REQUIREMENTS:**
- Generate ONE MCQ question that tests understanding of the specific concept from the student's question
- The question must be directly related to "${originalQuestion}"
- Provide exactly 4 options (A, B, C, D)
- Include the correct answer and explanation
- Make it appropriate for Class 10 CBSE level
- Keep the question concise and clear
- For mathematical expressions, use proper LaTeX formatting:
  * Use $expression$ for inline math (e.g., $a^2 + b^2$)
  * Use $$expression$$ for display math (e.g., $$(a + b)^2$$)
  * Use proper mathematical notation (e.g., $x^2$, $\\frac{a}{b}$, $\\sqrt{x}$)

**OUTPUT FORMAT (JSON):**
{
  "question": "Your contextual question here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explanation": "Brief explanation of why the correct answer is right"
}

**EXAMPLES:**
If student asked about "Newton's First Law", generate a question about inertia or objects at rest.
If student asked about "photosynthesis", generate a question about the process or requirements.
If student asked about "quadratic equations", generate a question about solving or identifying them.

Generate a contextual quiz question now:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are Geni Ma\'am, a warm Indian tutor. Generate contextual quiz questions based on student questions.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    
    // Try to parse the JSON response
    let quizData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing quiz JSON:', parseError);
      console.error('Raw response:', content);
      
      // Fallback to a simple contextual question
      quizData = {
        question: `Based on your question about "${originalQuestion}", which of the following best describes the main concept?`,
        options: [
          "The primary principle we discussed",
          "A related but different concept",
          "A common misconception about this topic",
          "An advanced application of this concept"
        ],
        correct: 0,
        explanation: "This relates to the core concept we just covered in your question."
      };
    }

    // Validate the quiz data structure
    if (!quizData.question || !quizData.options || !Array.isArray(quizData.options) || quizData.options.length !== 4) {
      throw new Error('Invalid quiz data structure');
    }

    // Ensure correct answer is within bounds
    if (quizData.correct < 0 || quizData.correct > 3) {
      quizData.correct = 0;
    }

    return NextResponse.json(quizData);

  } catch (error) {
    console.error('Error generating quiz:', error);
    
    // Return a fallback quiz question
    const fallbackQuiz = {
      question: "Based on our discussion, which of the following is most relevant?",
      options: [
        "The main concept we covered",
        "A related application",
        "A common misconception",
        "An advanced topic"
      ],
      correct: 0,
      explanation: "This relates to the core concept we just discussed."
    };

    return NextResponse.json(fallbackQuiz);
  }
}
