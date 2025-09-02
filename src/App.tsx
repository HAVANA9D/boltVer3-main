import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { SubjectView } from './components/SubjectView';
import { QuizView } from './components/QuizView';
import { ResultsView } from './components/ResultsView';
import { Settings } from './components/Settings';
import { initializeDB } from './utils/database';

export type View = 'dashboard' | 'subject' | 'quiz' | 'results' | 'settings';

interface NavigationData {
  subjectId?: string;
  quizId?: string;
  resultId?: string;
}

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [navigationData, setNavigationData] = useState<NavigationData>({});
  const [isDBReady, setIsDBReady] = useState(false);

  useEffect(() => {
    initializeDB().then(() => {
      setIsDBReady(true);
    });
  }, []);

  const navigate = (view: View, data: NavigationData = {}) => {
    setCurrentView(view);
    setNavigationData(data);
  };

  if (!isDBReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Initializing QuizVault...</p>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'subject':
        return <SubjectView subjectId={navigationData.subjectId!} onNavigate={navigate} />;
      case 'quiz':
        return <QuizView quizId={navigationData.quizId!} onNavigate={navigate} />;
      case 'results':
        return <ResultsView resultId={navigationData.resultId!} onNavigate={navigate} />;
      case 'settings':
        return <Settings onNavigate={navigate} />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation currentView={currentView} onNavigate={navigate} />
      <main className="container mx-auto px-4 py-8">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;