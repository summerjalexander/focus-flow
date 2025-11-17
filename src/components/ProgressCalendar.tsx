import React, { useState, useMemo } from 'react';
import { TasksByDate } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface ProgressCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  tasksByDate: TasksByDate;
  currentDate: Date;
  onSelectDate: (date: Date) => void;
}

const ProgressCalendar: React.FC<ProgressCalendarProps> = ({ isOpen, onClose, tasksByDate, currentDate, onSelectDate }) => {
  const [displayDate, setDisplayDate] = useState(new Date(currentDate));

  const { month, year, firstDayOfMonth, daysInMonth } = useMemo(() => {
    const date = new Date(displayDate);
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { month, year, firstDayOfMonth, daysInMonth };
  }, [displayDate]);

  // Update display date if the calendar is reopened on a different date
  React.useEffect(() => {
    if (isOpen) {
      setDisplayDate(new Date(currentDate));
    }
  }, [isOpen, currentDate]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    setDisplayDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    onSelectDate(today);
    onClose();
  };

  const getDayColor = (day: number): string => {
    const date = new Date(year, month, day);
    const dateKey = date.toISOString().split('T')[0];
    const tasks = tasksByDate[dateKey] || [];
    if (tasks.length === 0) return 'bg-[#69adaf]/10';

    const completed = tasks.filter(t => t.completed).length;
    const percentage = tasks.length > 0 ? completed / tasks.length : 0;

    if (percentage === 0) return 'bg-[#69adaf]/20';
    if (percentage < 0.5) return 'bg-[#007370]/40';
    if (percentage < 1) return 'bg-[#007370]/70';
    return 'bg-gradient-to-br from-[#007370] to-[#ee6650]';
  };
  
  const handleDayClick = (day: number) => {
    const newDate = new Date(year, month, day);
    onSelectDate(newDate);
    onClose();
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#060644] border-2 border-[#69adaf] rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md text-white" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-[#69adaf]/20">
                <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(displayDate)}</h2>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-[#69adaf]/20">
                <ChevronRightIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekdays.map(day => <div key={day} className="text-center font-semibold text-[#69adaf] text-sm">{day}</div>)}
          {blanks.map((_, i) => <div key={`blank-${i}`} />)}
          {days.map(day => (
            <button 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`w-full aspect-square rounded-md flex items-center justify-center text-lg font-bold ${getDayColor(day)} cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-[#060644] hover:ring-[#ee6650] transition-all duration-150`}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#69adaf]/30">
            <button
                onClick={handleGoToToday}
                className="bg-[#69adaf]/20 text-[#f7f7f7] font-semibold py-2 px-4 rounded-lg hover:bg-[#69adaf]/40 transition-colors"
            >
                Today
            </button>
             <button
                onClick={onClose}
                className="text-[#69adaf] font-semibold py-2 px-4 rounded-lg hover:text-white"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressCalendar;