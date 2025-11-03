import React, { useState, useMemo } from 'react';
import { TasksByDate } from '../types.ts';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from './Icons.tsx';

interface DatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  tasksByDate: TasksByDate;
}

const DatePicker: React.FC<DatePickerProps> = ({ isOpen, onClose, selectedDate, onSelectDate, tasksByDate }) => {
  const [displayDate, setDisplayDate] = useState(new Date(selectedDate));

  const { month, year, firstDayOfMonth, daysInMonth } = useMemo(() => {
    const date = new Date(displayDate);
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { month, year, firstDayOfMonth, daysInMonth };
  }, [displayDate]);

  const handlePrevMonth = () => {
    setDisplayDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayDate(new Date(year, month + 1, 1));
  };
  
  const handleDayClick = (day: number) => {
      const newDate = new Date(year, month, day);
      onSelectDate(newDate);
  }

  const handleGoToToday = () => {
      onSelectDate(new Date());
  }

  if (!isOpen) return null;

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = new Date();

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[#060644] rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-[#69adaf]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-[#69adaf]/20">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(displayDate)}
          </span>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-[#69adaf]/20">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdays.map(day => <div key={day} className="font-semibold text-[#69adaf] text-sm mb-2">{day}</div>)}
          {blanks.map((_, i) => <div key={`blank-${i}`} />)}
          {days.map(day => {
            const date = new Date(year, month, day);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === today.toDateString();
            const dateKey = date.toISOString().split('T')[0];
            const hasTasks = tasksByDate[dateKey] && tasksByDate[dateKey].length > 0;
            
            return (
              <div key={day} className="relative">
                <button
                  onClick={() => handleDayClick(day)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200
                    ${isSelected ? 'bg-[#ee6650] text-white font-bold' : ''}
                    ${!isSelected && isToday ? 'border-2 border-[#69adaf]' : ''}
                    ${!isSelected ? 'hover:bg-[#69adaf]/20' : ''}
                  `}
                >
                  {day}
                </button>
                 {hasTasks && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#007370] rounded-full"></div>
                )}
              </div>
            )
          })}
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

export default DatePicker;
