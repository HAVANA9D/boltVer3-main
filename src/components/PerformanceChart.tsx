import React from 'react';

interface ChartData {
  name: string;
  averageScore: number;
}

interface PerformanceChartProps {
  data: ChartData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        No data available
      </div>
    );
  }

  const maxScore = Math.max(...data.map(item => item.averageScore || 0));
  const chartHeight = 200;

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Subject Performance Comparison</h3>
      <div className="flex items-end space-x-3 h-48">
        {data.map((subject, index) => {
          const height = maxScore > 0 ? (subject.averageScore / maxScore) * chartHeight : 0;
          const colors = [
            'bg-blue-500',
            'bg-purple-500',
            'bg-green-500',
            'bg-orange-500',
            'bg-pink-500',
            'bg-indigo-500'
          ];
          const color = colors[index % colors.length];

          return (
            <div key={subject.name} className="flex-1 flex flex-col items-center">
              <div className="w-full flex justify-center mb-2">
                <div
                  className={`w-8 ${color} rounded-t transition-all duration-500 hover:opacity-80`}
                  style={{ height: `${height}px` }}
                />
              </div>
              <div className="text-xs text-slate-600 text-center font-medium">
                {subject.averageScore?.toFixed(0) || 0}%
              </div>
              <div className="text-xs text-slate-500 text-center truncate w-full mt-1">
                {subject.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}