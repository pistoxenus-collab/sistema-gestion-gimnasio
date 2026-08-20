import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  BookCheck, 
  BarChart3, 
  Users, 
  User as UserIcon, 
  LogOut, 
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenProfile }) => {
  const { user, logout, isProfessor } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('schedule')}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <img 
                src="/logo-f6.png" 
                alt="F6 Deporte y Recreación" 
                className="relative h-10 sm:h-12 w-auto object-contain rounded-lg bg-slate-900 px-1 py-0.5 border border-slate-700" 
              />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight f6-gradient-text">
                F6 DEPORTE Y RECREACIÓN
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold hidden sm:block">
                Gestión de Clases & Reservas
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'schedule'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 neon-glow-cyan'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Horario & Clases</span>
            </button>

            <button
              onClick={() => setActiveTab('my-classes')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'my-classes'
                  ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30 neon-glow-magenta'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookCheck className="w-4 h-4" />
              <span>Mis Clases</span>
            </button>

            {isProfessor && (
              <>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'reports'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Reportes Mensuales</span>
                </button>

                <button
                  onClick={() => setActiveTab('students')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'students'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Alumnos</span>
                </button>
              </>
            )}
          </nav>

          {/* User Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isProfessor 
                    ? 'bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white' 
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                }`}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                    {user?.name}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {isProfessor ? 'Profesor F6' : 'Socio F6'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isProfessor ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {isProfessor ? 'Profesor / Coach' : 'Socio Activo'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenProfile();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Mi Perfil & Datos</span>
                    </button>

                    <div className="my-1 border-t border-slate-800"></div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
