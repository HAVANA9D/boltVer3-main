import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { saveQuizResult, Quiz, AnsweredQuestion } from '../utils/database';

interface UploadAnswersModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  onResultCreated: (resultId: string) => void;
}

export function UploadAnswersModal({ isOpen, onClose, quiz, onResultCreated }: UploadAnswersModalProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setJsonInput('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!jsonInput.trim()) {
      setError('Please provide the answers JSON data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const parsedData = JSON.parse(jsonInput);
      
      if (!parsedData.answeredQuestions || !Array.isArray(parsedData.answeredQuestions)) {
        throw new Error('Invalid JSON format: missing answeredQuestions array');
      }

      const answeredQuestions: AnsweredQuestion[] = parsedData.answeredQuestions;

      // Validate that we have answers for all questions
      if (answeredQuestions.length !== quiz.questions.length) {
        throw new Error(`Expected ${quiz.questions.length} answered questions, but received ${answeredQuestions.length}`);
      }

      // Calculate score
      const correctCount = answeredQuestions.filter(q => q.userIsCorrect).length;
      const score = (correctCount / quiz.questions.length) * 100;

      // Create quiz result
      const result = await saveQuizResult({
        quizId: quiz.id,
        subjectId: quiz.subjectId,
        score,
        totalQuestions: quiz.questions.length,
        correctAnswers: correctCount,
        answeredQuestions,
        startTime: new Date(), // Use current time as start time
        completedAt: new Date()
      });

      onResultCreated(result.id);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload answers');
    } finally {
      setLoading(false);
    }
  };

  const exampleJson = {
    "answeredQuestions": [
      {
        "question": "What is the primary cause of Methemoglobinemia?",
        "userAnswer": "Excessive nitrate...",
        "userIsCorrect": true,
        "correctAnswer": "Excessive nitrate..."
      }
    ]
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-800">Upload Answers for: {quiz.title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <p className="text-slate-600 mb-4">
              Paste your completed quiz answers in JSON format to skip taking the quiz and go directly to results analysis.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">Expected format:</p>
                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{JSON.stringify(exampleJson, null, 2)}
                  </pre>
                  <p className="mt-2 text-xs">
                    Must include {quiz.questions.length} answered questions matching this quiz.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="answers" className="block text-sm font-medium text-slate-700 mb-2">
              Answers JSON Data *
            </label>
            <textarea
              id="answers"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono text-sm resize-none"
              placeholder="Paste your answers JSON here..."
            />
          </div>
        </div>

        <div className="flex space-x-3 p-6 border-t border-slate-200">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!jsonInput.trim() || loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Processing...' : 'Show Results'}
          </button>
        </div>
      </div>
    </div>
  );
}