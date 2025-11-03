import React, { useState } from 'react';
import { PlusIcon, XIcon, BrainIcon, MusicIcon, CalendarIcon } from './Icons.tsx';

interface FloatingActionButtonProps {
  onToggleBrainDump: () => void;
  onToggleSounds: () => void;
  onToggleCalendar: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onToggleBrainDump, onToggleSounds, onToggleCalendar }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: <BrainIcon className="w-6 h-6" />, action: onToggleBrainDump, label: 'Brain Dump' },
    { icon: <MusicIcon className="w-6 h-6" />, action: onToggleSounds, label: 'Sounds' },
    { icon: <CalendarIcon className="w-6 h-6" />, action: onToggleCalendar, label: 'Calendar' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <div className="flex flex-col items-center mb-4 space-y-3">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => { item.action(); setIsOpen(false); }}
              className="w-14 h-14 rounded-full bg-[#007370] text-[#f7f7f7] flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-200"
              aria-label={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-[#007370] to-[#ee6650] text-white flex items-center justify-center shadow-xl transform hover:scale-110 hover:rotate-12 transition-all duration-300"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <XIcon className="w-8 h-8" /> : <PlusIcon className="w-8 h-8" />}
      </button>
    </div>
  );
};

export default FloatingActionButton;
