import React, { useState } from 'react';
import { X, Upload, Sparkles, FileText } from 'lucide-react';
import { createQuiz, QuizData } from '../utils/database';
import { generateQuizWithAI } from '../utils/ai';

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizCreated: () => void;
  subjectId: string;
}

type TabType = 'manual' | 'json' | 'ai';

export function CreateQuizModal({ isOpen, onClose, onQuizCreated, subjectId }: CreateQuizModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [title, setTitle] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
   const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium'); // Add this
  const [quizType, setQuizType] = useState<'Theory' | 'Numerical'>('Theory'); // Add this

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setActiveTab('manual');
    setTitle('');
    setJsonInput('');
    setAiPrompt('');
    setQuestionCount(10);
    setError('');
  };

  const handleJsonSubmit = async () => {
    if (!title.trim() || !jsonInput.trim()) {
      setError('Please provide both a title and JSON data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const parsedData = JSON.parse(jsonInput);

      if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
        throw new Error('Invalid JSON format: missing questions array');
      }

      const quizData: QuizData = {
        title: title.trim(),
        questions: parsedData.questions,
        subjectId
      };

      await createQuiz(quizData);
      onQuizCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAISubmit = async () => {
    if (!title.trim() || !aiPrompt.trim()) {
      setError('Please provide both a title and topic description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const questions = await generateQuizWithAI(aiPrompt, questionCount);

      const quizData: QuizData = {
        title: title.trim(),
        questions,
          subjectId, // This should be chapterId now based on the previous step, assuming this modal is updated
          difficulty, // Add this
      quizType,
      };

      await createQuiz(quizData);
      onQuizCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'manual', label: 'Manual', icon: FileText },
    { id: 'json', label: 'Import JSON', icon: Upload },
    { id: 'ai', label: 'AI Generate', icon: Sparkles }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Create New Quiz</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Title Input (common for all tabs) */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter quiz title..."
              required
            />
          </div>

          {/* Manual Tab */}
          {activeTab === 'manual' && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">Manual quiz creation coming soon!</p>
              <p className="text-sm text-slate-500">For now, use JSON import or AI generation</p>
            </div>
          )}

          {/* JSON Tab */}
          {activeTab === 'json' && (
            <div>
              <label htmlFor="json" className="block text-sm font-medium text-slate-700 mb-2">
                Quiz JSON Data *
              </label>
              <textarea
                id="json"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono text-sm resize-none"
                placeholder='{"questions": [{"question": "Your question here?", "answerOptions": [{"text": "Option A", "isCorrect": false}, {"text": "Option B", "isCorrect": true}]}]}'
              />
              <p className="text-xs text-slate-500 mt-2">
                Paste your quiz JSON data. Must include a "questions" array with question and answerOptions.
              </p>
            </div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-4">


              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-2">
                  Topic/Subject Description *
                </label>
                <textarea
                  id="prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Describe the topic you want to create a quiz about. Be specific about the concepts, difficulty level, and any particular areas to focus on..."
                />
              </div>

              <div>
                <label htmlFor="questionCount" className="block text-sm font-medium text-slate-700 mb-2">
                  Number of Questions
                </label>
                <select
                  id="questionCount"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                  <option value={20}>20 questions</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700 mb-2">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div>
                <label htmlFor="quizType" className="block text-sm font-medium text-slate-700 mb-2">
                  Quiz Type
                </label>
                <select
                  id="quizType"
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option>Theory</option>
                  <option>Numerical</option>
                </select>
              </div>
            </div>
            </div>
          )}
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

          {activeTab === 'json' && (
            <button
              onClick={handleJsonSubmit}
              disabled={!title.trim() || !jsonInput.trim() || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Import Quiz'}
            </button>
          )}

          {activeTab === 'ai' && (
            <button
              onClick={handleAISubmit}
              disabled={!title.trim() || !aiPrompt.trim() || loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Quiz'}
            </button>
          )}

          {activeTab === 'manual' && (
            <button
              disabled
              className="flex-1 px-4 py-2 bg-slate-400 text-white rounded-lg cursor-not-allowed"
            >
              Coming Soon
            </button>
          )}
        </div>
      </div>
    </div>
  );
}