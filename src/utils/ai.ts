import { Question, getSubjectStats, getQuizResultsBySubject, getQuizResult } from './database';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

function getApiKey(): string {
  const apiKey = localStorage.getItem('gemini-api-key');
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please set it in Settings.');
  }
  return apiKey;
}

async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response format from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

export async function generateQuizWithAI(topic: string, questionCount: number): Promise<Question[]> {
  const prompt = `Create a quiz with exactly ${questionCount} multiple choice questions about: ${topic}

Please generate questions that are educational and appropriately challenging. Each question should have 4 answer options with only one correct answer.

Return ONLY a JSON object in this exact format:
{
  "questions": [
    {
      "question": "Your question text here?",
      "answerOptions": [
        {"text": "Option A", "isCorrect": false},
        {"text": "Option B", "isCorrect": true},
        {"text": "Option C", "isCorrect": false},
        {"text": "Option D", "isCorrect": false}
      ]
    }
  ]
}

Important: Return only the JSON, no additional text or formatting.`;

  try {
    const response = await callGeminiAPI(prompt);
    
    // Clean up the response to extract JSON
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON found in response');
    }
    
    const jsonStr = response.slice(jsonStart, jsonEnd);
    const data = JSON.parse(jsonStr);
    
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid quiz format received');
    }

    // Validate each question
    const validatedQuestions = data.questions.map((q: any, index: number) => {
      if (!q.question || !q.answerOptions || !Array.isArray(q.answerOptions)) {
        throw new Error(`Invalid question format at position ${index + 1}`);
      }

      if (q.answerOptions.length < 2) {
        throw new Error(`Question ${index + 1} must have at least 2 answer options`);
      }

      const correctAnswers = q.answerOptions.filter((opt: any) => opt.isCorrect);
      if (correctAnswers.length !== 1) {
        throw new Error(`Question ${index + 1} must have exactly one correct answer`);
      }

      return {
        question: q.question,
        answerOptions: q.answerOptions.map((opt: any) => ({
          text: opt.text,
          isCorrect: Boolean(opt.isCorrect)
        }))
      };
    });

    if (validatedQuestions.length !== questionCount) {
      throw new Error(`Expected ${questionCount} questions, but received ${validatedQuestions.length}`);
    }

    return validatedQuestions;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate quiz with AI');
  }
}

export async function generateAnalysis(
  type: 'subject' | 'result',
  subjectId?: string,
  resultId?: string
): Promise<string> {
  if (type === 'subject' && !subjectId) {
    throw new Error('Subject ID is required for subject analysis');
  }
  
  if (type === 'result' && !resultId) {
    throw new Error('Result ID is required for result analysis');
  }

  let prompt: string;

  if (type === 'subject') {
    // Get subject statistics and recent results
    const [stats, results] = await Promise.all([
      getSubjectStats(subjectId!),
      getQuizResultsBySubject(subjectId!)
    ]);

    if (results.length === 0) {
      throw new Error('No quiz results available for analysis');
    }

    const recentResults = results.slice(0, 10); // Last 10 results
    const resultsSummary = recentResults.map((result, index) => 
      `Quiz ${index + 1}: Score ${result.score.toFixed(1)}%, ${result.correctAnswers}/${result.totalQuestions} correct`
    ).join('\n');

    prompt = `Analyze this student's performance across multiple quizzes in a subject:

PERFORMANCE STATISTICS:
- Total Quizzes: ${stats.totalQuizzes}
- Total Attempts: ${stats.totalAttempts}
- Average Score: ${stats.averageScore.toFixed(1)}%

RECENT QUIZ RESULTS:
${resultsSummary}

Please provide a comprehensive strength and weakness analysis including:
1. Overall performance trends
2. Specific strengths (topics/areas where they excel)
3. Areas for improvement (consistent weak points)
4. Study recommendations
5. Suggested focus areas for future learning

Keep the analysis practical and actionable.`;

  } else {
    // Get specific quiz result details
    const result = await getQuizResult(resultId!);
    if (!result) {
      throw new Error('Quiz result not found');
    }

    const correctAnswers = result.answeredQuestions.filter(q => q.userIsCorrect);
    const incorrectAnswers = result.answeredQuestions.filter(q => !q.userIsCorrect);

    prompt = `Create a personalized study plan based on this quiz result:

QUIZ PERFORMANCE:
- Score: ${result.score.toFixed(1)}%
- Correct: ${result.correctAnswers}/${result.totalQuestions}

QUESTIONS ANSWERED CORRECTLY:
${correctAnswers.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}

QUESTIONS ANSWERED INCORRECTLY:
${incorrectAnswers.map((q, i) => `${i + 1}. ${q.question}
   Your answer: ${q.userAnswer}
   Correct answer: ${q.correctAnswer}`).join('\n')}

Please provide a detailed study plan including:
1. Topics to review based on incorrect answers
2. Strengths to maintain based on correct answers
3. Specific study strategies for weak areas
4. Recommended resources or methods
5. A suggested study schedule

Make the plan practical and actionable.`;
  }

  try {
    const analysis = await callGeminiAPI(prompt);
    return analysis.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate analysis');
  }
}