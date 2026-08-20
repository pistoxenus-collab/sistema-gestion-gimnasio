import React, { useState, useEffect } from 'react';
import { GymClass } from '../types';
import { classesApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { X, Dumbbell, Calendar, Clock, Users, MapPin, Sparkles, Plus, Check } from 'lucide-react';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingClass?: GymClass | null;
  initialDate?: string;
}

const CATEGORIES = [
  'Funcional',
  'Spinning',
  'Crossfit',
  'Boxeo',
  'GAP',
  'Yoga',
  'Pilates',
  'Calistenia'
];

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingClass,
  initialDate,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Funcional');
  const [description, setDescription] = useState('');
  const [instructorName, setInstructorName] = useState(user?.name || 'Prof. Carlos Mendoza');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [capacity, setCapacity] = useState(15);
  const [location, setLocation] = useState('Sala Principal');

  useEffect(() => {
    if (editingClass) {
      setTitle(editingClass.title);
      setCategory(editingClass.category);
      setDescription(editingClass.description || '');
      setInstructorName(editingClass.instructor_name);
      setDate(editingClass.date);
      setStartTime(editingClass.start_time);
      setEndTime(editingClass.end_time);
      setCapacity(editingClass.capacity);
      setLocation(editingClass.location || 'Sala Principal');
    } else {
      setTitle('');
      setCategory('Funcional');
      setDescription('');
      setInstructorName(user?.name || 'Prof. Carlos Mendoza');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setStartTime('08:00');
      setEndTime('09:00');
      setCapacity(15);
      setLocation('Sala Principal');
    }
  }, [editingClass, initialDate, isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('El nombre de la clase es obligatorio');
      return;
    }

    try {
      setLoading(true);
      if (editingClass) {
        await classesApi.updateClass(editingClass.id, {
          title: title.trim(),
          category,
          description: description.trim(),
          instructor_name: instructorName.trim(),
          date,
          start_time: startTime,
          end_time: endTime,
          capacity: Number(capacity),
          location: location.trim(),
        });
        success('Clase actualizada correctamente');
      } else {
        await classesApi.createClass({
          title: title.trim(),
          category,
          description: description.trim(),
          instructor_name: instructorName.trim(),
          date,
          start_time: startTime,
          end_time: endTime,
          capacity: Number(capacity),
          location: location.trim(),
        });
        success('Clase creada y publicada en el horario');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Error al guardar la clase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {editingClass ? 'Editar Clase' : 'Crear Nueva Clase'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingClass ? 'Modifica los detalles del horario' : 'Ofrece una nueva sesión de entrenamiento'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Category Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Disciplina / Categoría
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    if (!title || CATEGORIES.some(c => title.includes(c))) {
                      setTitle(`${cat} F6`);
                    }
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    category === cat
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre de la Clase *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Entrenamiento Funcional HIIT, Spinning Power..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Fecha *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-fuchsia-400" />
                Sala / Ubicación
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Sala Principal, Box F6, Sala Ciclo..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          {/* Time & Capacity */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Hora Inicio
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Hora Fin
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-fuchsia-400" />
                Cupos Máx.
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={capacity}
                onChange={e => setCapacity(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          {/* Instructor & Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Profesor / Instructor
            </label>
            <input
              type="text"
              value={instructorName}
              onChange={e => setInstructorName(e.target.value)}
              placeholder="Nombre del profesor"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción / Recomendaciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Traer toalla, botella de agua, nivel de intensidad..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : editingClass ? 'Guardar Cambios' : 'Publicar Clase'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
