import React, { useState } from 'react';
import { X, Sparkles, Loader } from 'lucide-react';
import { generateAnalysis } from '../utils/ai';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId?: string;
  resultId?: string;
  type: 'subject' | 'result';
}

export function AIAnalysisModal({ isOpen, onClose, subjectId, resultId, type }: AIAnalysisModalProps) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const result = await generateAnalysis(type, subjectId, resultId);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setAnalysis('');
    setError('');
  };

  const title = type === 'subject' ? 'AI Strength & Weakness Analysis' : 'AI Study Plan';
  const description = type === 'subject' 
    ? 'Get personalized insights about your performance across all quizzes in this subject'
    : 'Get a personalized study plan based on your quiz performance';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 mb-6">{description}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!analysis && !loading && (
            <div className="text-center py-8">
              <button
                onClick={handleGenerate}
                className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors mx-auto"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate {type === 'subject' ? 'Analysis' : 'Study Plan'}</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <Loader className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-slate-600">Generating your personalized {type === 'subject' ? 'analysis' : 'study plan'}...</p>
            </div>
          )}

          {analysis && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-slate-700 font-sans leading-relaxed">
                  {analysis}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}