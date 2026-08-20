import React, { useState, useEffect } from 'react';
import { GymClass } from '../types';
import { classesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ClassCard } from '../components/ClassCard';
import { ClassModal } from '../components/ClassModal';
import { EnrollmentListModal } from '../components/EnrollmentListModal';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  Flame, 
  Dumbbell, 
  RefreshCw, 
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Todas' },
  { id: 'Funcional', label: 'Funcional' },
  { id: 'Spinning', label: 'Spinning' },
  { id: 'Crossfit', label: 'Crossfit' },
  { id: 'Boxeo', label: 'Boxeo' },
  { id: 'GAP', label: 'GAP' },
  { id: 'Yoga', label: 'Yoga' },
  { id: 'Pilates', label: 'Pilates' },
];

export const SchedulePage: React.FC = () => {
  const { isProfessor, user } = useAuth();
  const { success, error } = useToast();

  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<GymClass | null>(null);
  const [inspectingClass, setInspectingClass] = useState<GymClass | null>(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await classesApi.getClasses({
        date: selectedDate,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
      });
      setClasses(data);
    } catch (err: any) {
      error(err.message || 'Error al cargar las clases del día');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [selectedDate, selectedCategory, searchQuery, user]);

  const handleDeleteClass = async (classId: number) => {
    try {
      await classesApi.deleteClass(classId);
      success('Clase eliminada del horario');
      fetchClasses();
    } catch (err: any) {
      error(err.message || 'Error al eliminar la clase');
    }
  };

  // Generate date carousel for the next 7 days and past 2 days
  const getDateButtons = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = -1; i <= 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      
      const dayName = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-ES', { weekday: 'short' });
      const dayNumber = d.getDate();
      const monthName = d.toLocaleDateString('es-ES', { month: 'short' });

      dates.push({ iso, dayName, dayNumber, monthName, isToday: i === 0 });
    }
    return dates;
  };

  const dateButtons = getDateButtons();

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 -mb-10 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Reserva tu Lugar
              </span>
              <span className="text-xs text-slate-400">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Clases Disponibles de Hoy
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {isProfessor 
                ? 'Como profesor, puedes crear y administrar los cupos, además de pasar asistencia a los alumnos inscritos.' 
                : 'Inscríbete a tus entrenamientos diarios en un clic. Recuerda desinscribirte si no puedes asistir para liberar tu cupo.'}
            </p>
          </div>

          {/* Professor Action: Create Class Button */}
          {isProfessor && (
            <button
              onClick={() => {
                setEditingClass(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 active:scale-95 transition flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Nueva Clase</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Selector Strip (Mobile-first Touch Carousel) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
            Selecciona una Fecha
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
          {dateButtons.map(item => {
            const isSelected = selectedDate === item.iso;
            return (
              <button
                key={item.iso}
                onClick={() => setSelectedDate(item.iso)}
                className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[72px] py-2.5 px-3 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-500/20 to-blue-600/20 border-cyan-400 text-white neon-glow-cyan shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className={`text-[11px] font-semibold uppercase ${isSelected ? 'text-cyan-300 font-bold' : ''}`}>
                  {item.dayName}
                </span>
                <span className="text-lg font-black text-white my-0.5">
                  {item.dayNumber}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">
                  {item.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Category Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-fuchsia-500 text-white font-bold shadow-md shadow-fuchsia-500/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por clase o profesor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

      </div>

      {/* Class Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm font-semibold">Cargando horario de clases...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Dumbbell className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No hay clases programadas para esta fecha</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            No se encontraron clases con los filtros seleccionados. Prueba cambiando el día o la disciplina.
          </p>
          {isProfessor && (
            <button
              onClick={() => {
                setEditingClass(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              Crear Clase para este día
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(gymClass => (
            <ClassCard
              key={gymClass.id}
              gymClass={gymClass}
              onRefresh={fetchClasses}
              onOpenAttendees={c => setInspectingClass(c)}
              onEditClass={c => {
                setEditingClass(c);
                setIsCreateModalOpen(true);
              }}
              onDeleteClass={handleDeleteClass}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ClassModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingClass(null);
        }}
        onSuccess={fetchClasses}
        editingClass={editingClass}
        initialDate={selectedDate}
      />

      <EnrollmentListModal
        gymClass={inspectingClass}
        onClose={() => setInspectingClass(null)}
        onRefreshClass={fetchClasses}
      />

    </div>
  );
};
