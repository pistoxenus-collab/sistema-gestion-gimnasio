import React, { useState, useEffect } from 'react';
import { MonthlyReportData, MonthlyReportStudent } from '../types';
import { reportsApi } from '../services/api';
import { MonthPicker } from '../components/MonthPicker';
import { useToast } from '../context/ToastContext';
import { 
  BarChart3, 
  Download, 
  Users, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  Dumbbell, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Phone, 
  Clock, 
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet
} from 'lucide-react';

export const MonthlyReportsPage: React.FC = () => {
  const { error } = useToast();
  const today = new Date();
  const [month, setMonth] = useState<number>(today.getMonth() + 1);
  const [year, setYear] = useState<number>(today.getFullYear());
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchStudent, setSearchStudent] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'students' | 'classes' | 'logs'>('students');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getMonthlyReport(month, year);
      setReport(data);
    } catch (err: any) {
      error(err.message || 'Error al obtener reporte mensual');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  const toggleStudentExpand = (id: number) => {
    setExpandedStudentId(prev => (prev === id ? null : id));
  };

  const filteredStudents = report?.students.filter(s =>
    s.user_name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.user_email.toLowerCase().includes(searchStudent.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      
      {/* Header & Month Picker */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-purple-400" />
                Auditoría & Cierre de Mes
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Reporte Mensual de Clases
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Revisa el detalle de qué alumnos asistieron a cuáles clases durante el mes y exporta la información.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MonthPicker
              month={month}
              year={year}
              onChange={(m, y) => {
                setMonth(m);
                setYear(y);
              }}
            />

            <a
              href={reportsApi.getExportCsvUrl(month, year)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
              title="Descargar archivo Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel (CSV)</span>
            </a>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Clases Dictadas</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {report.metrics.total_classes}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Sesiones programadas</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Asistencias Confirmadas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              {report.metrics.total_attended}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Alumnos presentes</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Alumnos Activos</span>
              <Users className="w-4 h-4 text-fuchsia-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-fuchsia-400">
              {report.metrics.unique_active_students}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Socios entrenando</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Tasa de Asistencia</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-400">
              {report.metrics.attendance_rate}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Cumplimiento de reservas</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('students')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'students'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Alumnos & Clases Tomadas ({report?.students.length || 0})
          </button>

          <button
            onClick={() => setActiveView('classes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'classes'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Resumen por Disciplina
          </button>

          <button
            onClick={() => setActiveView('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'logs'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Bitácora Cronológica ({report?.logs.length || 0})
          </button>
        </div>

        {activeView === 'students' && (
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar alumno por nombre o correo..."
              value={searchStudent}
              onChange={e => setSearchStudent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-sm font-semibold">Generando reporte del mes...</p>
        </div>
      ) : activeView === 'students' ? (
        /* Students Attendance Breakdown */
        <div className="space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center text-slate-400">
              <p className="text-sm font-semibold">No se encontraron alumnos para este mes con los filtros dados.</p>
            </div>
          ) : (
            filteredStudents.map(student => {
              const isExpanded = expandedStudentId === student.user_id;

              return (
                <div
                  key={student.user_id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden transition shadow-sm hover:border-slate-700"
                >
                  {/* Student Summary Row */}
                  <div
                    onClick={() => toggleStudentExpand(student.user_id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-850/50"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {student.user_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {student.user_name}
                          {student.attended_count > 0 && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                              {student.attended_count} {student.attended_count === 1 ? 'asistencia' : 'asistencias'}
                            </span>
                          )}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {student.user_email}
                          </span>
                          {student.user_phone && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {student.user_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Clases Tomadas</div>
                        <div className="text-sm font-black text-white">
                          {student.classes.length} <span className="text-slate-500 font-normal">en el mes</span>
                        </div>
                      </div>

                      <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded: Which classes did this student take? */}
                  {isExpanded && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/50">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
                        Detalle de Clases Tomadas por {student.user_name} en este Mes:
                      </div>

                      {student.classes.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">
                          Este alumno no tomó clases durante el mes seleccionado.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {student.classes.map((cls, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-2"
                            >
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-cyan-300">
                                    {cls.category}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    {cls.date} • {cls.start_time} hrs
                                  </span>
                                </div>
                                <h5 className="text-xs font-bold text-white">{cls.title}</h5>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Prof. {cls.instructor_name}
                                </p>
                              </div>

                              <div>
                                {cls.attendance_status === 'attended' && (
                                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                                    Presente
                                  </span>
                                )}
                                {cls.attendance_status === 'absent' && (
                                  <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                                    Ausente
                                  </span>
                                )}
                                {cls.attendance_status === 'enrolled' && (
                                  <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                                    Inscrito
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : activeView === 'classes' ? (
        /* Discipline / Category Summary */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report?.categories.map((cat, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {cat.category}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {cat.total_sessions} sesiones
                </span>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Inscripciones:</span>
                  <span className="font-bold text-white">{cat.total_enrolled}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Asistencias Confirmadas:</span>
                  <span className="font-bold text-emerald-400">{cat.total_attended}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Promedio por Sesión:</span>
                  <span className="font-bold text-cyan-400">{cat.avg_attendance_per_session} alumnos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Full Chronological Logs Table */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Fecha & Hora</th>
                  <th className="p-3.5">Clase</th>
                  <th className="p-3.5">Alumno</th>
                  <th className="p-3.5">Contacto</th>
                  <th className="p-3.5">Profesor</th>
                  <th className="p-3.5 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {report?.logs.map(log => (
                  <tr key={log.enrollment_id} className="hover:bg-slate-850/50 transition">
                    <td className="p-3.5 font-medium text-white whitespace-nowrap">
                      {log.class_date} • {log.start_time} hrs
                    </td>
                    <td className="p-3.5 font-semibold text-cyan-300 whitespace-nowrap">
                      {log.class_title}
                    </td>
                    <td className="p-3.5 font-bold text-white whitespace-nowrap">
                      {log.student_name}
                    </td>
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {log.student_email} {log.student_phone && `• ${log.student_phone}`}
                    </td>
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {log.instructor_name}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      {log.status === 'attended' && (
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                          Presente
                        </span>
                      )}
                      {log.status === 'absent' && (
                        <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                          Ausente
                        </span>
                      )}
                      {log.status === 'enrolled' && (
                        <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                          Inscrito
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
