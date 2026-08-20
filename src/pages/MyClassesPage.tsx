import React, { useState, useEffect } from 'react';
import { MyEnrollment } from '../types';
import { enrollmentsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  BookCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  XCircle, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface MyClassesPageProps {
  onGoToSchedule: () => void;
}

export const MyClassesPage: React.FC<MyClassesPageProps> = ({ onGoToSchedule }) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'upcoming' | 'history'>('upcoming');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      const data = await enrollmentsApi.getMyClasses();
      setEnrollments(data);
    } catch (err: any) {
      error(err.message || 'Error al cargar tus clases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyClasses();
  }, [user]);

  const handleCancelBooking = async (classId: number, classTitle: string) => {
    if (!window.confirm(`¿Confirmas que deseas desinscribirte de la clase "${classTitle}"?`)) {
      return;
    }

    try {
      setCancellingId(classId);
      const res = await enrollmentsApi.cancelBooking(classId);
      success(res.message, 'Desinscripción');
      fetchMyClasses();
    } catch (err: any) {
      error(err.message || 'Error al cancelar la inscripción');
    } finally {
      setCancellingId(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingClasses = enrollments.filter(e => e.date >= todayStr);
  const historyClasses = enrollments.filter(e => e.date < todayStr);

  const displayedList = activeSubTab === 'upcoming' ? upcomingClasses : historyClasses;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 flex items-center gap-1">
                <BookCheck className="w-3 h-3 text-fuchsia-400" />
                Mis Reservas
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Mis Clases & Asistencia
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Consulta tus clases reservadas para hoy y los próximos días, o revisa tu historial de entrenamientos.
            </p>
          </div>

          <button
            onClick={onGoToSchedule}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex-shrink-0"
          >
            <span>Ver Cartelera de Clases</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtabs: Próximas vs Historial */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveSubTab('upcoming')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeSubTab === 'upcoming'
              ? 'text-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Próximas Clases</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {upcomingClasses.length}
          </span>
          {activeSubTab === 'upcoming' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeSubTab === 'history'
              ? 'text-fuchsia-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Historial / Pasadas</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {historyClasses.length}
          </span>
          {activeSubTab === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fuchsia-400 rounded-full"></div>
          )}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-fuchsia-400 animate-spin" />
          <p className="text-sm font-semibold">Cargando tus inscripciones...</p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <BookCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {activeSubTab === 'upcoming' ? 'No tienes clases reservadas próximas' : 'Aún no tienes historial de clases'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {activeSubTab === 'upcoming'
              ? 'Revisa el horario del día y aprovecha de reservar tu cupo para entrenar con nosotros.'
              : 'Las clases a las que asistas quedarán guardadas aquí.'}
          </p>
          {activeSubTab === 'upcoming' && (
            <button
              onClick={onGoToSchedule}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              Explorar Clases del Día
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedList.map(item => {
            const isPast = item.date < todayStr;
            const isToday = item.date === todayStr;

            return (
              <div
                key={item.enrollment_id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition"
              >
                <div>
                  {/* Status & Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                      {item.category}
                    </span>

                    {item.enrollment_status === 'attended' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Asististe
                      </span>
                    )}

                    {item.enrollment_status === 'absent' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Ausente
                      </span>
                    )}

                    {item.enrollment_status === 'enrolled' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 rounded-full animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isToday ? '¡Hoy!' : 'Inscrito'}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                    {item.title}
                  </h3>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold text-white">
                        {new Date(item.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>{item.start_time} - {item.end_time} hrs</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{item.location || 'Sala Principal'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Prof. {item.instructor_name}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                {!isPast && item.enrollment_status === 'enrolled' && (
                  <div className="pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleCancelBooking(item.class_id, item.title)}
                      disabled={cancellingId === item.class_id}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold transition active:scale-[0.98] disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>{cancellingId === item.class_id ? 'Cancelando...' : 'Desinscribirme'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
