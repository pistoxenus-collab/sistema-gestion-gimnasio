import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface MonthPickerProps {
  month: number; // 1 - 12
  year: number;
  onChange: (month: number, year: number) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MonthPicker: React.FC<MonthPickerProps> = ({ month, year, onChange }) => {
  const handlePrevMonth = () => {
    if (month === 1) {
      onChange(12, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onChange(1, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-sm">
      <button
        onClick={handlePrevMonth}
        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        title="Mes anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 px-3 py-1">
        <Calendar className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-bold text-white capitalize">
          {MONTH_NAMES[month - 1]} {year}
        </span>
      </div>

      <button
        onClick={handleNextMonth}
        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        title="Mes siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
