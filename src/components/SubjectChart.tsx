import React, { useState, useEffect } from 'react';
import { getQuizResultsBySubject, QuizResult } from '../utils/database';

interface SubjectChartProps {
  subjectId: string;
}

export function SubjectChart({ subjectId }: SubjectChartProps) {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [subjectId]);

  const loadResults = async () => {
    try {
      const resultsData = await getQuizResultsBySubject(subjectId);
      setResults(resultsData.slice(-10)); // Show last 10 results
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || results.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Quiz Performance</h3>
        <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
          {loading ? 'Loading...' : 'No quiz attempts yet'}
        </div>
      </div>
    );
  }

  const maxScore = 100;
  const chartHeight = 120;

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Quiz Performance</h3>
      <div className="flex items-end space-x-2 h-32">
        {results.map((result, index) => {
          const height = (result.score / maxScore) * chartHeight;
          const color = result.score >= 80 ? 'bg-green-500' : result.score >= 60 ? 'bg-yellow-500' : 'bg-red-500';

          return (
            <div key={result.id} className="flex-1 flex flex-col items-center">
              <div className="w-full flex justify-center mb-1">
                <div
                  className={`w-4 ${color} rounded-t transition-all duration-500 hover:opacity-80`}
                  style={{ height: `${height}px` }}
                  title={`${result.score.toFixed(1)}% - ${new Date(result.completedAt).toLocaleDateString()}`}
                />
              </div>
              <div className="text-xs text-slate-600 text-center">
                {result.score.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}