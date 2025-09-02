import { Question, getSubjectStats, getQuizResultsBySubject, getQuizResult } from './database';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// The interface for the structured analysis data
export interface AnalysisData {
  strengths: { topic: string; description: string }[];
  improvements: { topic: string; description: string }[];
}

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

// ... (generateQuizWithAI function remains the same)

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
): Promise<AnalysisData> {
  if (type === 'subject' && !subjectId) {
    throw new Error('Subject ID is required for subject analysis');
  }

  if (type === 'result' && !resultId) {
    throw new Error('Result ID is required for result analysis');
  }

  let prompt: string;

  if (type === 'subject') {
    // This part remains unchanged for now, but could also be updated to JSON
    const [stats, results] = await Promise.all([
      getSubjectStats(subjectId!),
      getQuizResultsBySubject(subjectId!)
    ]);

    if (results.length === 0) {
      throw new Error('No quiz results available for analysis');
    }

    const recentResults = results.slice(0, 10);
    const resultsSummary = recentResults.map((result, index) =>
      `Quiz ${index + 1}: Score ${result.score.toFixed(1)}%, ${result.correctAnswers}/${result.totalQuestions} correct`
    ).join('\n');

    prompt = `Analyze this student's performance...`; // Unchanged prompt
    const analysisText = await callGeminiAPI(prompt);
    // For simplicity, we'll wrap the old text format in the new structure for subject analysis
    return {
      strengths: [{ topic: "Overall Performance", description: analysisText }],
      improvements: [],
    };

  } else {
    // UPDATED FOR QUIZ RESULT ANALYSIS
    const result = await getQuizResult(resultId!);
    if (!result) {
      throw new Error('Quiz result not found');
    }

    // --- THIS IS THE FIX ---
    // We now get both correct and incorrect answers to send to the AI
    const correctAnswers = result.answeredQuestions.filter(q => q.userIsCorrect);
    const incorrectAnswers = result.answeredQuestions.filter(q => !q.userIsCorrect);

    prompt = `Based on the following quiz results, identify the user's strengths and areas for improvement.

QUIZ SCORE: ${result.score.toFixed(1)}% (${result.correctAnswers}/${result.totalQuestions})

CORRECT ANSWERS (for identifying strengths):
${correctAnswers.map(q => `- Question: "${q.question}"`).join('\n')}

INCORRECT ANSWERS (for identifying areas to improve):
${incorrectAnswers.map(q => `- Question: "${q.question}" (User answered: "${q.userAnswer}", Correct: "${q.correctAnswer}")`).join('\n')}

Return ONLY a JSON object in this exact format, with no extra text or markdown:
{
  "strengths": [
    { "topic": "Topic Name", "description": "Briefly explain why the user is strong in this topic based on their correct answers." }
  ],
  "improvements": [
    { "topic": "Topic to Improve", "description": "Based on the incorrect answers, explain what the user should study for this topic and why it's important." }
  ]
}`;
  }

  try {
    const response = await callGeminiAPI(prompt);
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON found in response');
    }

    const jsonStr = response.slice(jsonStart, jsonEnd);
    return JSON.parse(jsonStr) as AnalysisData;

  } catch (error) {
    console.error("AI Analysis Error:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to parse AI analysis: ${error.message}`);
    }
    throw new Error('Failed to generate analysis');
  }
}