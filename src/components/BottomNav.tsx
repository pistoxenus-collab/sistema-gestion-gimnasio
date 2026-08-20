import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, BookCheck, BarChart3, Users, User as UserIcon } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onOpenProfile }) => {
  const { isProfessor } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 safe-bottom">
      <div className="flex items-center justify-around">
        
        {/* Clases / Schedule */}
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'schedule'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg transition ${activeTab === 'schedule' ? 'bg-cyan-500/15' : ''}`}>
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Clases</span>
        </button>

        {/* Mis Clases */}
        <button
          onClick={() => setActiveTab('my-classes')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'my-classes'
              ? 'text-fuchsia-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg transition ${activeTab === 'my-classes' ? 'bg-fuchsia-500/15' : ''}`}>
            <BookCheck className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Mis Clases</span>
        </button>

        {/* Profesor: Reportes Mensuales */}
        {isProfessor && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'reports'
                ? 'text-purple-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg transition ${activeTab === 'reports' ? 'bg-purple-500/15' : ''}`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Reportes</span>
          </button>
        )}

        {/* Profesor: Alumnos */}
        {isProfessor && (
          <button
            onClick={() => setActiveTab('students')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'students'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg transition ${activeTab === 'students' ? 'bg-indigo-500/15' : ''}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Alumnos</span>
          </button>
        )}

        {/* Perfil */}
        <button
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
        >
          <div className="p-1 rounded-lg">
            <UserIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Perfil</span>
        </button>

      </div>
    </div>
  );
};
