import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Target, TrendingUp, Sparkles } from 'lucide-react';
import { View } from '../App';
import { getAllSubjects, getSubjectStats, Subject } from '../utils/database';
import { PerformanceChart } from './PerformanceChart';
import { CreateSubjectModal } from './CreateSubjectModal';

interface DashboardProps {
  onNavigate: (view: View, data?: any) => void;
}

interface SubjectWithStats extends Subject {
  totalQuizzes: number;
  averageScore: number;
  totalAttempts: number;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allSubjects = await getAllSubjects();
      const subjectsWithStats = await Promise.all(
        allSubjects.map(async (subject) => {
          const stats = await getSubjectStats(subject.id);
          return {
            ...subject,
            ...stats
          };
        })
      );
      setSubjects(subjectsWithStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallStats = () => {
    const totalQuizzes = subjects.reduce((sum, subject) => sum + subject.totalQuizzes, 0);
    const totalAttempts = subjects.reduce((sum, subject) => sum + subject.totalAttempts, 0);
    const averageScore = subjects.length > 0
      ? subjects.reduce((sum, subject) => sum + (subject.averageScore || 0), 0) / subjects.length
      : 0;

    return { totalQuizzes, totalAttempts, averageScore };
  };

  const overallStats = calculateOverallStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Study Dashboard</h1>
          <p className="text-slate-600 mt-1">Track your learning progress across all subjects</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">Add Subject</span>
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No subjects yet</h2>
          <p className="text-slate-500 mb-6">Create your first subject to start building your quiz vault</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Create Subject
          </button>
        </div>
      ) : (
        <>
          {/* Overall Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800">Overall Performance</h2>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{subjects.length}</div>
                <div className="text-slate-600">Active Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">{overallStats.totalQuizzes}</div>
                <div className="text-slate-600">Total Quizzes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {overallStats.averageScore.toFixed(1)}%
                </div>
                <div className="text-slate-600">Average Score</div>
              </div>
            </div>

            <PerformanceChart data={subjects} />
          </div>

          {/* Subjects Grid */}
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Your Subjects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  onClick={() => onNavigate('subject', { subjectId: subject.id })}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {subject.name}
                    </h3>
                    <Target className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>

                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{subject.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-slate-800">{subject.totalQuizzes}</div>
                      <div className="text-xs text-slate-500">Quizzes</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {subject.averageScore?.toFixed(1) || '0'}%
                      </div>
                      <div className="text-xs text-slate-500">Avg Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <CreateSubjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubjectCreated={loadData}
      />
    </div>
  );
}