import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { reportsApi } from '../services/api';
import { X, User, Phone, Mail, Shield, Check, LogOut } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser, logout, isProfessor } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await reportsApi.updateProfile(name, phone);
      await refreshUser();
      success('Tus datos de perfil han sido actualizados');
      onClose();
    } catch (err: any) {
      error(err.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white ${
              isProfessor ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600' : 'bg-gradient-to-br from-cyan-500 to-blue-600'
            }`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{user.name}</h3>
              <p className="text-xs text-slate-400 capitalize">
                {isProfessor ? 'Profesor / Administrador F6' : 'Alumno / Socio F6'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Correo Electrónico (No editable)
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full bg-slate-800/40 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-fuchsia-400" />
              Teléfono / WhatsApp de Contacto
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+56 9 1234 5678"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              Rol en el Gimnasio
            </label>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-xs flex items-center justify-between">
              <span className="font-semibold text-white">
                {isProfessor ? 'Profesor / Coach' : 'Alumno / Socio'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isProfessor ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                {isProfessor ? 'ACCESO COMPLETO' : 'SOCIO ACTIVO'}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
