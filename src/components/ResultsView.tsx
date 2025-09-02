import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { View } from '../App';
import { getQuizResult, getQuiz, QuizResult, Quiz } from '../utils/database';
import { AIAnalysisModal } from './AIAnalysisModal';

interface ResultsViewProps {
  resultId: string;
  onNavigate: (view: View, data?: any) => void;
}

export function ResultsView({ resultId, onNavigate }: ResultsViewProps) {
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resultData = await getQuizResult(resultId);
        if (resultData) {
          const quizData = await getQuiz(resultData.quizId);
          setResult(resultData);
          setQuiz(quizData);
        }
      } catch (error) {
        console.error('Failed to load result data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [resultId]);

  if (loading) {
    return <div className="text-center py-12">Loading Results...</div>;
  }

  if (!result || !quiz) {
    return <div className="text-center py-12">Results not found.</div>;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('subject', { subjectId: result.subjectId })}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Quiz Results</h1>
            <p className="text-slate-600 mt-1">{quiz.title}</p>
          </div>
        </div>
        <button
          onClick={() => setIsAnalysisModalOpen(true)}
          className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Sparkles className="h-4 w-4" />
          <span>AI Study Plan</span>
        </button>
      </div>

      {/* Score Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <Trophy className={`h-10 w-10 mx-auto mb-2 ${getScoreColor(result.score)}`} />
          <p className="text-slate-600">Your Score</p>
          <h2 className={`text-5xl font-bold my-2 ${getScoreColor(result.score)}`}>
            {result.score.toFixed(0)}%
          </h2>
          <p className="font-medium text-slate-700">
            {result.correctAnswers} out of {result.totalQuestions} correct
          </p>
      </div>

      {/* --- THIS IS THE NEW REVIEW SECTION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800">Review Your Answers</h3>
        </div>

        <div className="divide-y divide-slate-200">
          {result.answeredQuestions.map((answer, index) => (
            <div key={index} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {answer.userIsCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-medium mb-4">
                    {index + 1}. {answer.question}
                  </p>

                  <div className="space-y-3 text-sm">
                    <div className={`border-l-4 p-3 rounded-r-md ${
                        answer.userIsCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                      }`}
                    >
                      <p className="font-semibold text-slate-700 mb-1">Your answer:</p>
                      <p className={answer.userIsCorrect ? 'text-green-800' : 'text-red-800'}>
                        {answer.userAnswer}
                      </p>
                    </div>

                    {!answer.userIsCorrect && (
                      <div className="border-l-4 border-slate-400 bg-slate-50 p-3 rounded-r-md">
                        <p className="font-semibold text-slate-700 mb-1">Correct answer:</p>
                        <p className="text-slate-800">{answer.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* --- END OF NEW REVIEW SECTION --- */}


      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={() => onNavigate('quiz', { quizId: quiz.id })}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          Retake Quiz
        </button>
        <button
          onClick={() => onNavigate('subject', { subjectId: result.subjectId })}
          className="flex-1 border border-slate-300 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-50 font-medium"
        >
          Back to Subject
        </button>
      </div>

      <AIAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        resultId={resultId}
        type="result"
      />
    </div>
  );
}