import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar, Trophy } from 'lucide-react';
import { View } from '../App';
import { getSubject, getQuizzesBySubject, Subject, Quiz, getQuizResultsBySubject, QuizResult } from '../utils/database';

interface SubjectViewProps {
  subjectId: string;
  onNavigate: (view: View, data?: any) => void;
}

export function SubjectView({ subjectId, onNavigate }: SubjectViewProps) {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [subjectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const subjectData = await getSubject(subjectId);
      if (subjectData) {
        setSubject(subjectData);
        const [quizzesData, resultsData] = await Promise.all([
          getQuizzesBySubject(subjectData.id),
          getQuizResultsBySubject(subjectData.id)
        ]);
        setQuizzes(quizzesData);
        setResults(resultsData);
      }
    } catch (error) {
      console.error('Failed to load subject data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!subject) {
    return <div className="text-center py-12">Subject not found.</div>;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('dashboard')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{subject.name}</h1>
            <p className="text-slate-600 mt-1">{subject.description}</p>
          </div>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          <span>Add Quiz</span>
        </button>
      </div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => {
          const latestResult = results.find(r => r.quizId === quiz.id);

          return (
            <div
              key={quiz.id}
              // --- THIS IS THE KEY CHANGE ---
              onClick={() => {
                if (latestResult) {
                  // If a result exists, go to the results page
                  onNavigate('results', { resultId: latestResult.id });
                } else {
                  // Otherwise, start the quiz
                  onNavigate('quiz', { quizId: quiz.id });
                }
              }}
              // --- END OF KEY CHANGE ---
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer group"
            >
              <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors mb-2">
                {quiz.title}
              </h3>

              <div className="flex items-center space-x-2 mb-3">
                {quiz.difficulty && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      quiz.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      quiz.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                      {quiz.difficulty}
                  </span>
                )}
                {quiz.type && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {quiz.type}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-slate-500 text-sm border-t border-slate-100 pt-3">
                <div className="flex items-center space-x-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                </div>

                {latestResult && (
                  <div className={`flex items-center space-x-1 font-semibold ${getScoreColor(latestResult.score)}`}>
                    <Trophy className="h-4 w-4" />
                    <span>{latestResult.score.toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}