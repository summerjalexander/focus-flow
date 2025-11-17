import React from 'react';
import { Subtask } from '../types';
import { TrashIcon } from './Icons';

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const SubtaskItem: React.FC<SubtaskItemProps> = ({ subtask, onToggle, onDelete }) => {
  return (
    <div className="flex items-center pl-8 py-2">
      <label className="flex items-center cursor-pointer flex-grow">
        <div className="relative">
          <input
            type="checkbox"
            checked={subtask.completed}
            onChange={() => onToggle(subtask.id)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded transition-all duration-200 ${subtask.completed ? 'bg-[#007370]/70 border-2 border-[#007370]' : 'border-2 border-[#69adaf]/50 bg-[#060644]'}`}>
            {subtask.completed && (
              <svg className="w-full h-full text-[#f7f7f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <span className={`ml-3 text-base ${subtask.completed ? 'line-through text-[#69adaf]' : 'text-[#f7f7f7]/90'}`}>
          {subtask.text}
        </span>
      </label>
      <button onClick={() => onDelete(subtask.id)} className="ml-2 text-[#69adaf]/50 hover:text-[#ee6650] transition-colors duration-200 p-1" aria-label={`Delete subtask: ${subtask.text}`}>
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SubtaskItem;