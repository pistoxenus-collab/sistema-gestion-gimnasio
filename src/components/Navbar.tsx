import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { User } from '../types';
import { 
  Dumbbell, 
  Calendar, 
  BookCheck, 
  BarChart3, 
  Users, 
  User as UserIcon, 
  LogOut, 
  ChevronDown, 
  ShieldAlert, 
  Sparkles,
  Phone
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenProfile }) => {
  const { user, logout, isProfessor, quickLogin } = useAuth();
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  useEffect(() => {
    authApi.getDemoUsers().then(setDemoUsers).catch(console.error);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
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
            <div className="hidden sm:block">
              <div className="text-lg font-black tracking-tight f6-gradient-text">
                F6 DEPORTE Y RECREACIÓN
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                Plataforma de Clases & Reservas
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

          {/* User Profile & Demo Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Fast Demo Account Switcher Button */}
            <button
              onClick={() => setShowSwitchModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-cyan-300 font-medium transition shadow-sm"
              title="Cambiar entre cuenta de Profesor y Alumno"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">Probar como:</span>
              <span className="font-bold bg-slate-900 px-1.5 py-0.5 rounded text-[11px] text-white">
                {isProfessor ? 'Profesor' : 'Alumno'}
              </span>
            </button>

            {/* Profile Dropdown */}
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
                    {isProfessor ? 'Profesor F6' : 'Alumno'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* User Menu Modal */}
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
                        {isProfessor ? 'Profesor / Admin' : 'Socio / Alumno'}
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

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowSwitchModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-cyan-300 hover:text-cyan-200 hover:bg-cyan-950/40 transition"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Cambiar de Usuario Demo</span>
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

      {/* Demo Account Switcher Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Selector Rápido de Cuenta Demo</h3>
              </div>
              <button 
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-white text-lg px-2"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Prueba la plataforma desde la perspectiva del <strong>Profesor</strong> (crear clases, ver inscritos, reportes mensuales) o de un <strong>Alumno</strong> (inscribirse/desinscribirse de clases del día).
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold text-fuchsia-400 uppercase tracking-wider px-1">
                Profesor / Administración
              </div>
              {demoUsers.filter(u => u.role === 'professor' || u.role === 'admin').map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    quickLogin(u.id);
                    setShowSwitchModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                    user?.id === u.id
                      ? 'bg-fuchsia-950/40 border-fuchsia-500/50 text-white'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </div>
                  </div>
                  {user?.id === u.id && (
                    <span className="text-[10px] bg-fuchsia-500 text-white px-2 py-0.5 rounded-full font-bold">
                      Activo
                    </span>
                  )}
                </button>
              ))}

              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider px-1 pt-2">
                Alumnos / Socios
              </div>
              {demoUsers.filter(u => u.role === 'student').map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    quickLogin(u.id);
                    setShowSwitchModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                    user?.id === u.id
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </div>
                  </div>
                  {user?.id === u.id && (
                    <span className="text-[10px] bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                      Activo
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
