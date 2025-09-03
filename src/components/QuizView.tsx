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
    setQuizState(prev => {
      const currentAnswers = { ...prev.answers };

      // If the clicked answer is already selected, unselect it by deleting the key
      if (currentAnswers[prev.currentQuestionIndex] === answerIndex) {
        delete currentAnswers[prev.currentQuestionIndex];
      } else {
        // Otherwise, select the new answer
        currentAnswers[prev.currentQuestionIndex] = answerIndex;
      }

      return { ...prev, answers: currentAnswers };
    });
  };

  const handleQuestionJump = (questionIndex: number) => {
    setQuizState(prev => ({ ...prev, currentQuestionIndex: questionIndex }));
  };

  const handleNext = () => {
    if (!quiz) return;
    if (quizState.currentQuestionIndex < quiz.questions.length - 1) {
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
  const progress = (Object.keys(quizState.answers).length / quiz.questions.length) * 100;
  const isLastQuestion = quizState.currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={() => onNavigate('subject', { subjectId: quiz.subjectId })}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{quiz.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Question & Answers */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <p className="text-slate-600 mb-2">
              Question {quizState.currentQuestionIndex + 1} of {quiz.questions.length}
            </p>
            <h2 className="text-2xl font-semibold text-slate-800 mb-8">{currentQuestion.question}</h2>
            <div className="space-y-4">
              {currentQuestion.answerOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedAnswer === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center font-bold text-sm bg-slate-100 text-slate-600">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="font-medium text-slate-700">{option.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Navigation & Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionJump(index)}
                  className={`h-10 w-10 rounded-md font-medium text-sm transition-all ${
                    quizState.currentQuestionIndex === index
                      ? 'bg-blue-600 text-white shadow'
                      : quizState.answers[index] !== undefined
                      ? 'bg-white border-2 border-blue-500 text-blue-500'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-3">Progress</h3>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-600 mt-2 text-center">
              {Object.keys(quizState.answers).length} of {quiz.questions.length} questions answered
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <div className="flex space-x-3">
              <button
                onClick={handlePrevious}
                disabled={quizState.currentQuestionIndex === 0}
                className="flex-1 px-4 py-3 border rounded-lg hover:bg-slate-50 disabled:opacity-50 font-medium"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={isLastQuestion}
                className="flex-1 px-4 py-3 border rounded-lg hover:bg-slate-50 disabled:opacity-50 font-medium"
              >
                Next
              </button>
            </div>
            <button
              onClick={handleFinishQuiz}
              className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Finish & See Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}