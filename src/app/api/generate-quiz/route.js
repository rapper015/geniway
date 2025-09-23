import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  try {
    const { subject, originalQuestion, aiResponse, context } = await request.json();

    if (!originalQuestion) {
      return NextResponse.json(
        { error: 'Original question is required' },
        { status: 400 }
      );
    }

    // Create a contextual quiz generation prompt based on AI's response
    const prompt = `You are Geni Ma'am, a warm Indian tutor. Generate a contextual quiz question based on the AI's response to the student's question.

STUDENT'S ORIGINAL QUESTION: "${originalQuestion}"
AI'S RESPONSE: "${aiResponse || 'No AI response provided'}"
SUBJECT: ${subject || 'general'}
CONTEXT: ${context || 'No additional context'}

**REQUIREMENTS:**
- Generate ONE MCQ question that tests understanding of the specific concepts explained in the AI's response
- The question must be directly related to the content and concepts covered in the AI's response
- Focus on the educational content that was actually explained, not just the original question
- Provide exactly 4 options (A, B, C, D)
- Include the correct answer and explanation
- Make it appropriate for Class 10 CBSE level
- Keep the question concise and clear
- For mathematical expressions, use simple text notation to avoid JSON parsing issues:
  * Use "a^2 + b^2" instead of LaTeX
  * Use "sqrt(25)" instead of "\\sqrt{25}"
  * Use "a/b" instead of "\\frac{a}{b}"
  * Use "c^2" instead of "$c^2$"
  * Avoid dollar signs and backslashes in mathematical expressions

**OUTPUT FORMAT (JSON):**
{
  "question": "Your contextual question here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explanation": "Brief explanation of why the correct answer is right"
}

**EXAMPLES:**
If AI explained "Newton's First Law" and mentioned inertia, generate a question about inertia or objects at rest.
If AI explained "photosynthesis" and mentioned the process, generate a question about the process or requirements.
If AI explained "quadratic equations" and showed how to solve them, generate a question about solving or identifying them.

**IMPORTANT:** Base your question on what the AI actually explained in their response, not just the original question topic.

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
        const jsonString = jsonMatch[0];
        quizData = JSON.parse(jsonString);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing quiz JSON:', parseError);
      console.error('Raw response:', content);
      
      // Try to extract question and options manually if JSON parsing fails
      try {
        const questionMatch = content.match(/"question":\s*"([^"]+)"/);
        const optionsMatch = content.match(/"options":\s*\[(.*?)\]/s);
        const correctMatch = content.match(/"correct":\s*(\d+)/);
        const explanationMatch = content.match(/"explanation":\s*"([^"]+)"/);
        
        if (questionMatch && optionsMatch && correctMatch) {
          // Parse options array manually
          const optionsString = optionsMatch[1];
          const options = optionsString.match(/"([^"]+)"/g)?.map(opt => opt.slice(1, -1)) || [];
          
          quizData = {
            question: questionMatch[1],
            options: options,
            correct: parseInt(correctMatch[1]),
            explanation: explanationMatch ? explanationMatch[1] : "This question tests your understanding of the concept."
          };
        } else {
          throw new Error('Could not extract quiz data manually');
        }
      } catch (manualParseError) {
        console.error('Manual parsing also failed:', manualParseError);
        
        // Final fallback to a simple contextual question
        const responseSummary = aiResponse ? aiResponse.substring(0, 100) + "..." : "the topic we discussed";
        quizData = {
          question: `Based on the explanation about "${responseSummary}", which of the following best describes the main concept?`,
          options: [
            "The primary principle we discussed",
            "A related but different concept", 
            "A common misconception about this topic",
            "An advanced application of this concept"
          ],
          correct: 0,
          explanation: "This relates to the core concept we just covered in the AI's response."
        };
      }
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
    
    // Return a fallback quiz question based on AI response
    const { aiResponse } = await request.json().catch(() => ({}));
    const responseSummary = aiResponse ? aiResponse.substring(0, 50) + "..." : "our discussion";
    
    const fallbackQuiz = {
      question: `Based on the explanation about "${responseSummary}", which of the following is most relevant?`,
      options: [
        "The main concept we covered",
        "A related application",
        "A common misconception",
        "An advanced topic"
      ],
      correct: 0,
      explanation: "This relates to the core concept we just covered in the AI's response."
    };

    return NextResponse.json(fallbackQuiz);
  }
}
