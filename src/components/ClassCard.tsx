import React, { useState } from 'react';
import { GymClass } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { enrollmentsApi } from '../services/api';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  MapPin, 
  User, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface ClassCardProps {
  gymClass: GymClass;
  onRefresh: () => void;
  onOpenAttendees: (gymClass: GymClass) => void;
  onEditClass?: (gymClass: GymClass) => void;
  onDeleteClass?: (classId: number) => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  gymClass,
  onRefresh,
  onOpenAttendees,
  onEditClass,
  onDeleteClass,
}) => {
  const { isProfessor } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Category styling helpers
  const getCategoryTheme = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('funcional')) {
      return {
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        border: 'hover:border-cyan-500/50',
        progress: 'bg-cyan-400',
        accent: 'text-cyan-400',
      };
    }
    if (cat.includes('spinning') || cat.includes('ciclo')) {
      return {
        badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
        border: 'hover:border-fuchsia-500/50',
        progress: 'bg-fuchsia-400',
        accent: 'text-fuchsia-400',
      };
    }
    if (cat.includes('cross') || cat.includes('fuerza')) {
      return {
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        border: 'hover:border-amber-500/50',
        progress: 'bg-amber-400',
        accent: 'text-amber-400',
      };
    }
    if (cat.includes('box')) {
      return {
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        border: 'hover:border-rose-500/50',
        progress: 'bg-rose-400',
        accent: 'text-rose-400',
      };
    }
    if (cat.includes('gap') || cat.includes('glúteo')) {
      return {
        badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        border: 'hover:border-purple-500/50',
        progress: 'bg-purple-400',
        accent: 'text-purple-400',
      };
    }
    if (cat.includes('yoga') || cat.includes('pilates')) {
      return {
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        border: 'hover:border-emerald-500/50',
        progress: 'bg-emerald-400',
        accent: 'text-emerald-400',
      };
    }
    return {
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      border: 'hover:border-blue-500/50',
      progress: 'bg-blue-400',
      accent: 'text-blue-400',
    };
  };

  const theme = getCategoryTheme(gymClass.category);
  const occupancyPercent = Math.min(100, Math.round((gymClass.enrolled_count / gymClass.capacity) * 100));

  const handleBook = async () => {
    try {
      setLoading(true);
      const res = await enrollmentsApi.bookClass(gymClass.id);
      success(res.message, '¡Inscripción Exitosa!');
      
      // Trigger celebratory confetti!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#00e5ff', '#d946ef', '#3b82f6', '#ffffff']
        });
      } catch (_) {}

      onRefresh();
    } catch (err: any) {
      error(err.message || 'No se pudo completar la inscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm(`¿Seguro que deseas desinscribirte de "${gymClass.title}"? Liberarás tu cupo para otro compañero.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await enrollmentsApi.cancelBooking(gymClass.id);
      success(res.message, 'Desinscripción');
      onRefresh();
    } catch (err: any) {
      error(err.message || 'No se pudo cancelar la inscripción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative bg-slate-900/90 rounded-2xl p-5 border border-slate-800 transition-all duration-300 shadow-lg ${theme.border} hover:shadow-xl flex flex-col justify-between`}>
      
      {/* Top Header: Category Badge & Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${theme.badge}`}>
              {gymClass.category}
            </span>
            {gymClass.is_enrolled && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Estás Inscrito
              </span>
            )}
            {gymClass.is_full && !gymClass.is_enrolled && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                <AlertCircle className="w-3 h-3" />
                Lleno
              </span>
            )}
          </div>

          {/* Professor Quick Actions Dropdown */}
          {isProfessor && (
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showOptions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)}></div>
                  <div className="absolute right-0 mt-1 w-36 bg-slate-850 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1 z-20 text-xs">
                    {onEditClass && (
                      <button
                        onClick={() => {
                          setShowOptions(false);
                          onEditClass(gymClass);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800 transition"
                      >
                        <Edit className="w-3.5 h-3.5 text-cyan-400" />
                        Editar Clase
                      </button>
                    )}
                    {onDeleteClass && (
                      <button
                        onClick={() => {
                          setShowOptions(false);
                          if (window.confirm(`¿Seguro que deseas eliminar la clase "${gymClass.title}"?`)) {
                            onDeleteClass(gymClass.id);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/30 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar Clase
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-snug">
          {gymClass.title}
        </h3>

        {/* Details: Time, Location, Instructor */}
        <div className="space-y-1.5 text-xs text-slate-300 mb-4">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${theme.accent}`} />
            <span className="font-semibold text-white">
              {gymClass.start_time} - {gymClass.end_time} hrs
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{gymClass.location || 'Sala Principal'}</span>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span>Prof. {gymClass.instructor_name}</span>
          </div>

          {gymClass.description && (
            <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 italic">
              "{gymClass.description}"
            </p>
          )}
        </div>
      </div>

      {/* Bottom Area: Capacity & Action Buttons */}
      <div className="pt-3 border-t border-slate-800 space-y-3">
        
        {/* Capacity Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Cupos:
            </span>
            <span className="font-semibold text-white">
              <span className={gymClass.available_spots > 0 ? theme.accent : 'text-rose-400'}>
                {gymClass.enrolled_count}
              </span>
              <span className="text-slate-500"> / {gymClass.capacity}</span>
              <span className="text-[11px] text-slate-400 ml-1.5">
                ({gymClass.available_spots > 0 ? `${gymClass.available_spots} libres` : 'Completo'})
              </span>
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPercent >= 100 
                  ? 'bg-rose-500' 
                  : occupancyPercent >= 80 
                    ? 'bg-amber-400' 
                    : theme.progress
              }`}
              style={{ width: `${occupancyPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {/* Professor Action: View Attendees */}
          {isProfessor && (
            <button
              onClick={() => onOpenAttendees(gymClass)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 transition"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Ver Inscritos ({gymClass.enrolled_count})
            </button>
          )}

          {/* Student Actions */}
          {gymClass.is_enrolled ? (
            <button
              onClick={handleCancelBooking}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold text-xs transition active:scale-[0.98] disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>{loading ? 'Cancelando...' : 'Desinscribirme'}</span>
            </button>
          ) : gymClass.is_full ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800/80 text-slate-500 border border-slate-700/50 font-semibold text-xs cursor-not-allowed"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Sin Cupos Disponibles</span>
            </button>
          ) : (
            <button
              onClick={handleBook}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition shadow-lg hover:shadow-cyan-500/30 active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{loading ? 'Inscribiendo...' : 'Inscribirme a esta Clase'}</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
