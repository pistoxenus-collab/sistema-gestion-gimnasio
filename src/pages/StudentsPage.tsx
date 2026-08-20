import React, { useState, useEffect } from 'react';
import { StudentDirectoryItem } from '../types';
import { reportsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { error } = useToast();
  const [students, setStudents] = useState<StudentDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getStudentsList();
      setStudents(data);
    } catch (err: any) {
      error(err.message || 'Error al cargar lista de alumnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone && s.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                <Users className="w-3 h-3 text-indigo-400" />
                Directorio de Socios
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Alumnos Registrados
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Lista completa de los alumnos del gimnasio con sus datos de contacto e historial de asistencia acumulado.
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-750 border-slate-700 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 transition"
            />
          </div>
        </div>
      </div>

      {/* Grid of Students */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm font-semibold">Cargando directorio de alumnos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center text-slate-400">
          <p className="text-sm font-semibold">No se encontraron alumnos con el criterio de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(student => (
            <div
              key={student.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-md">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">{student.name}</h3>
                    <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
                      Socio Activo
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-300 truncate">{student.email}</span>
                  </div>

                  {student.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" />
                      <a
                        href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline font-medium"
                      >
                        {student.phone} (WhatsApp)
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Sin teléfono registrado</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats pill */}
              <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 text-[10px]">Asistencias</div>
                  <div className="text-sm font-black text-emerald-400">{student.total_attended}</div>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400 text-[10px]">Reservas Activas</div>
                  <div className="text-sm font-black text-cyan-400">{student.active_bookings}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
