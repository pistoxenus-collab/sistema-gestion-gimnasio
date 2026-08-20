import React, { useEffect, useState } from 'react';
import { GymClass, ClassAttendee } from '../types';
import { enrollmentsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  Users, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Phone, 
  Mail, 
  Calendar, 
  Sparkles,
  UserCheck,
  RefreshCw
} from 'lucide-react';

interface EnrollmentListModalProps {
  gymClass: GymClass | null;
  onClose: () => void;
  onRefreshClass: () => void;
}

export const EnrollmentListModal: React.FC<EnrollmentListModalProps> = ({
  gymClass,
  onClose,
  onRefreshClass,
}) => {
  const [attendees, setAttendees] = useState<ClassAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { success, error } = useToast();

  const fetchAttendees = async () => {
    if (!gymClass) return;
    try {
      setLoading(true);
      const data = await enrollmentsApi.getClassAttendees(gymClass.id);
      setAttendees(data);
    } catch (err: any) {
      error(err.message || 'Error al cargar alumnos inscritos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gymClass) {
      fetchAttendees();
    }
  }, [gymClass]);

  if (!gymClass) return null;

  const handleUpdateStatus = async (enrollmentId: number, newStatus: 'enrolled' | 'attended' | 'absent') => {
    try {
      setUpdatingId(enrollmentId);
      await enrollmentsApi.updateAttendance(enrollmentId, newStatus);
      
      setAttendees(prev =>
        prev.map(a => (a.enrollment_id === enrollmentId ? { ...a, enrollment_status: newStatus } : a))
      );
      
      const statusLabel = newStatus === 'attended' ? 'Presente' : newStatus === 'absent' ? 'Ausente' : 'Inscrito';
      success(`Asistencia actualizada: ${statusLabel}`);
      onRefreshClass();
    } catch (err: any) {
      error(err.message || 'Error al actualizar asistencia');
    } finally {
      setUpdatingId(null);
    }
  };

  const attendedCount = attendees.filter(a => a.enrollment_status === 'attended').length;
  const absentCount = attendees.filter(a => a.enrollment_status === 'absent').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {gymClass.category}
              </span>
              <span className="text-xs text-slate-400">
                {gymClass.date} • {gymClass.start_time} - {gymClass.end_time} hrs
              </span>
            </div>
            <h3 className="text-lg font-bold text-white leading-tight">{gymClass.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Profesor: <strong className="text-slate-200">{gymClass.instructor_name}</strong> • {gymClass.location}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="bg-slate-950/60 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400">Total Inscritos: </span>
              <strong className="text-cyan-400 font-bold">{attendees.length} / {gymClass.capacity}</strong>
            </div>
            <div>
              <span className="text-slate-400">Presentes: </span>
              <strong className="text-emerald-400 font-bold">{attendedCount}</strong>
            </div>
            <div>
              <span className="text-slate-400">Ausentes: </span>
              <strong className="text-rose-400 font-bold">{absentCount}</strong>
            </div>
          </div>

          <button
            onClick={fetchAttendees}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Attendees List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs">Cargando lista de alumnos inscritos...</span>
            </div>
          ) : attendees.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Users className="w-10 h-10 text-slate-600 mb-1" />
              <p className="text-sm font-semibold text-slate-300">Aún no hay alumnos inscritos</p>
              <p className="text-xs text-slate-500">Los alumnos que se inscriban a través de la app aparecerán aquí en tiempo real.</p>
            </div>
          ) : (
            attendees.map((attendee, index) => (
              <div
                key={attendee.enrollment_id}
                className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-600 transition"
              >
                {/* Student Info */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {attendee.user_name}
                      {attendee.enrollment_status === 'attended' && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold">
                          Presente
                        </span>
                      )}
                      {attendee.enrollment_status === 'absent' && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-semibold">
                          Ausente
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {attendee.user_email}
                      </span>
                      {attendee.user_phone && (
                        <a
                          href={`https://wa.me/${attendee.user_phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-cyan-400 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {attendee.user_phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendance Buttons for Professor */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => handleUpdateStatus(attendee.enrollment_id, 'attended')}
                    disabled={updatingId === attendee.enrollment_id}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      attendee.enrollment_status === 'attended'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-850 bg-slate-800 text-slate-300 hover:bg-emerald-950 hover:text-emerald-300 border border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Presente</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(attendee.enrollment_id, 'absent')}
                    disabled={updatingId === attendee.enrollment_id}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      attendee.enrollment_status === 'absent'
                        ? 'bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20'
                        : 'bg-slate-850 bg-slate-800 text-slate-300 hover:bg-rose-950 hover:text-rose-300 border border-slate-700'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Ausente</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 rounded-b-3xl flex justify-between items-center text-xs text-slate-400">
          <span>Control de asistencia para fin de mes</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
