import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { User } from '../types';
import { 
  Dumbbell, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, quickLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authApi.getDemoUsers().then(setDemoUsers).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, phone, role);
      }
    } catch (_) {
      // Error handled by AuthContext via Toast
    } finally {
      setLoading(false);
    }
  };

  const profUser = demoUsers.find(u => u.role === 'professor');
  const studentUser = demoUsers.find(u => u.role === 'student');

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      
      {/* Background Neon Blurs */}
      <div className="fixed top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-md w-full space-y-6">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-block relative group mb-3">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <img 
              src="/logo-f6.png" 
              alt="F6 Deporte y Recreación" 
              className="relative h-14 sm:h-16 w-auto object-contain rounded-xl bg-slate-900 px-3 py-1 border border-slate-700" 
            />
          </div>
          <h1 className="text-2xl font-black f6-gradient-text tracking-tight">
            F6 DEPORTE Y RECREACIÓN
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Plataforma de Clases Diarias, Reservas y Reportes
          </p>
        </div>

        {/* Quick Demo 1-Click Access Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Acceso Rápido de Prueba (1 Clic)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {profUser && (
              <button
                onClick={() => quickLogin(profUser.id)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-fuchsia-950/40 to-slate-900 border border-fuchsia-500/40 hover:border-fuchsia-400 text-left transition group shadow-md"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 group-hover:scale-105 transition">
                  P
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white group-hover:text-fuchsia-300 transition">
                    Entrar como Profesor
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Control total & Reportes
                  </div>
                </div>
              </button>
            )}

            {studentUser && (
              <button
                onClick={() => quickLogin(studentUser.id)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-left transition group shadow-md"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 group-hover:scale-105 transition">
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                    Entrar como Alumno
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Inscripción y reservas
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Regular Login / Register Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          
          {/* Tab switch */}
          <div className="flex bg-slate-950 p-1 rounded-2xl mb-5 border border-slate-800">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                isLogin
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                !isLogin
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Registrar Cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Teléfono / WhatsApp (Opcional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo de Cuenta
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`p-2 rounded-xl text-xs font-semibold border transition ${
                        role === 'student'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Alumno / Socio
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('professor')}
                      className={`p-2 rounded-xl text-xs font-semibold border transition ${
                        role === 'professor'
                          ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Profesor / Coach
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm transition shadow-lg shadow-cyan-500/25 active:scale-[0.98] disabled:opacity-50"
            >
              {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{loading ? 'Procesando...' : isLogin ? 'Ingresar a mi Cuenta' : 'Crear Cuenta'}</span>
            </button>
          </form>

        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500">
          F6 Deporte y Recreación &copy; {new Date().getFullYear()} • Plataforma Web Móvil
        </p>

      </div>
    </div>
  );
};
