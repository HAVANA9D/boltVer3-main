import React, { useState, useEffect } from 'react';
import { ArrowLeft, Key, Save, AlertCircle } from 'lucide-react';
import { View } from '../App';

interface SettingsProps {
  onNavigate: (view: View) => void;
}

export function Settings({ onNavigate }: SettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini-api-key', apiKey.trim());
    } else {
      localStorage.removeItem('gemini-api-key');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
          <p className="text-slate-600 mt-1">Configure your QuizVault preferences</p>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Key className="h-5 w-5 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-800">API Configuration</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-2">
              Google Gemini API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your Gemini API key..."
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How to get your API key:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                  <li>Sign in with your Google account</li>
                  <li>Create a new API key</li>
                  <li>Copy and paste it here</li>
                </ol>
                <p className="mt-2 text-xs">Your API key is stored locally and never sent to our servers.</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </button>
            
            {saved && (
              <div className="flex items-center space-x-2 text-green-600 px-4 py-2">
                <span className="text-sm font-medium">Settings saved!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">About QuizVault</h2>
        <div className="space-y-3 text-slate-600">
          <p>
            QuizVault is a personal, AI-powered study application that helps you create, take, and analyze quizzes 
            to improve your learning outcomes.
          </p>
          <p>
            All your data is stored locally in your browser, ensuring complete privacy and offline functionality.
          </p>
          <div className="pt-2 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Version 1.0.0 • Built with React & IndexedDB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}