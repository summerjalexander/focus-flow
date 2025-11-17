import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, FireIcon, CalendarDaysIcon } from './Icons';
import DatePicker from './DatePicker';
import { TasksByDate } from '../types';

interface HeaderProps {
  currentDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  onSetDate: (date: Date) => void;
  streak: number;
  tasksByDate: TasksByDate;
}

const Header: React.FC<HeaderProps> = ({ currentDate, onPrevDay, onNextDay, onSetDate, streak, tasksByDate }) => {
  const isToday = currentDate.toDateString() === new Date().toDateString();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(currentDate);

  const shortFormattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(currentDate);
  
  const handleDateSelect = (date: Date) => {
    onSetDate(date);
    setIsDatePickerOpen(false);
  }

  const handleGoToToday = () => {
    onSetDate(new Date());
  };

  return (
    <header className="text-center text-[#f7f7f7] mb-8">
        <div className="flex justify-center items-center gap-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#007370] to-[#ee6650]">
                Focus Flow
            </h1>
            {streak > 0 && (
                <div className="flex items-center gap-1 bg-[#ee6650]/20 text-[#ee6650] px-3 py-1 rounded-full">
                    <FireIcon className="w-5 h-5" />
                    <span className="font-bold text-lg">{streak}</span>
                </div>
            )}
        </div>
      <p className="text-base sm:text-lg text-[#69adaf] mt-2">Your Daily Priority Checklist</p>
      <div className="flex items-center justify-center mt-6 gap-4 sm:gap-6">
        <button
          onClick={onPrevDay}
          className="p-2 rounded-full bg-[#69adaf]/20 hover:bg-[#69adaf]/40 transition-colors duration-200"
          aria-label="Previous day"
        >
          <ChevronLeftIcon className="w-6 h-6 text-[#f7f7f7]" />
        </button>
        <div className="text-center">
            <button 
              onClick={() => setIsDatePickerOpen(true)}
              className="flex items-center justify-center gap-2 text-base sm:text-xl font-bold text-[#f7f7f7] hover:text-[#ee6650] transition-colors"
            >
              <CalendarDaysIcon className="w-5 h-5 flex-shrink-0 text-[#f7f7f7]" />
              <div className="text-[#f7f7f7]">
                <span className="hidden sm:block">{formattedDate}</span>
                <span className="block sm:hidden">{shortFormattedDate}</span>
              </div>
            </button>
            {isToday ? (
              <span className="text-sm font-semibold text-[#ee6650] mt-1 inline-block">Today</span>
            ) : (
              <button 
                onClick={handleGoToToday}
                className="text-sm font-semibold text-[#69adaf] hover:text-[#ee6650] transition-colors mt-1"
                aria-label="Go to today"
              >
                Go to Today
              </button>
            )}
        </div>
        <button
          onClick={onNextDay}
          className="p-2 rounded-full bg-[#69adaf]/20 hover:bg-[#69adaf]/40 transition-colors duration-200"
          aria-label="Next day"
        >
          <ChevronRightIcon className="w-6 h-6 text-[#f7f7f7]" />
        </button>
      </div>
      <DatePicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={currentDate}
        onSelectDate={handleDateSelect}
        tasksByDate={tasksByDate}
      />
    </header>
  );
};

export default Header;
