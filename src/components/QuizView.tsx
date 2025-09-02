import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { View } from '../App';
import { getQuiz, saveQuizResult, Quiz } from '../utils/database';

interface QuizViewProps {
  quizId: string;
  onNavigate: (view: View, data?: any) => void;
}

interface QuizState {
  currentQuestionIndex: number;
  answers: { [questionIndex: number]: number };
  startTime: Date;
}

export function QuizView({ quizId, onNavigate }: QuizViewProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    startTime: new Date()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quizData = await getQuiz(quizId);
        setQuiz(quizData);
        setQuizState({ currentQuestionIndex: 0, answers: {}, startTime: new Date() });
      } catch (error) {
        console.error('Failed to load quiz:', error);
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [quizId]);

  const handleAnswerSelect = (answerIndex: number) => {
    setQuizState(prev => ({
      ...prev,
      answers: { ...prev.answers, [prev.currentQuestionIndex]: answerIndex }
    }));
  };

  const handleNext = () => {
    if (!quiz) return;
    const isLastQuestion = quizState.currentQuestionIndex === quiz.questions.length - 1;
    if (isLastQuestion) {
      handleFinishQuiz();
    } else {
      setQuizState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
    }
  };

  const handlePrevious = () => {
    setQuizState(prev => ({ ...prev, currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1) }));
  };

  const handleFinishQuiz = async () => {
    if (!quiz) return;

    try {
      const answeredQuestions = quiz.questions.map((question, index) => {
        const selectedAnswerIndex = quizState.answers[index];
        const selectedAnswer = selectedAnswerIndex !== undefined ? question.answerOptions[selectedAnswerIndex] : null;
        const correctAnswer = question.answerOptions.find(option => option.isCorrect);
        return {
          question: question.question,
          userAnswer: selectedAnswer?.text || 'No answer',
          userIsCorrect: selectedAnswer?.isCorrect || false,
          correctAnswer: correctAnswer?.text || 'Unknown'
        };
      });

      const correctCount = answeredQuestions.filter(q => q.userIsCorrect).length;
      const score = (correctCount / quiz.questions.length) * 100;

      const result = await saveQuizResult({
        quizId: quiz.id,
        subjectId: quiz.subjectId,
        score,
        totalQuestions: quiz.questions.length,
        correctAnswers: correctCount,
        answeredQuestions,
        startTime: quizState.startTime,
        completedAt: new Date()
      });

      onNavigate('results', { resultId: result.id });
    } catch (error) {
      console.error('Failed to save quiz result:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading Quiz...</div>;
  }
  if (!quiz) {
    return <div className="text-center py-12">Quiz not found.</div>;
  }

  const currentQuestion = quiz.questions[quizState.currentQuestionIndex];
  const selectedAnswer = quizState.answers[quizState.currentQuestionIndex];
  const progress = ((quizState.currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = quizState.currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => onNavigate('subject', { subjectId: quiz.subjectId })}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{quiz.title}</h1>
          <p className="text-slate-600">
            Question {quizState.currentQuestionIndex + 1} of {quiz.questions.length}
          </p>
        </div>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">{currentQuestion.question}</h2>
        <div className="space-y-3">
          {currentQuestion.answerOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedAnswer === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3 font-medium">
                <div
                  className={`w-5 h-5 flex-shrink-0 rounded-full border-2 ${
                    selectedAnswer === index ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                  }`}
                />
                <span>{option.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={quizState.currentQuestionIndex === 0}
          className="px-6 py-3 border rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={selectedAnswer === undefined}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLastQuestion ? 'Finish Quiz' : 'Next'}
        </button>
      </div>
    </div>
  );
}