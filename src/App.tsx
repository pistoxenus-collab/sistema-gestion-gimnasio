import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SchedulePage } from './pages/SchedulePage';
import { MyClassesPage } from './pages/MyClassesPage';
import { MonthlyReportsPage } from './pages/MonthlyReportsPage';
import { StudentsPage } from './pages/StudentsPage';
import { AuthPage } from './pages/AuthPage';
import { UserProfileModal } from './components/UserProfileModal';
import { RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isLoading, isProfessor } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('schedule');
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Iniciando F6 Deporte y Recreación...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-fuchsia-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {activeTab === 'schedule' && <SchedulePage />}
        {activeTab === 'my-classes' && <MyClassesPage onGoToSchedule={() => setActiveTab('schedule')} />}
        {activeTab === 'reports' && isProfessor && <MonthlyReportsPage />}
        {activeTab === 'students' && isProfessor && <StudentsPage />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Profile & Settings Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export default App;
