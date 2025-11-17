import React, { useState } from 'react';
import { FocusSession } from '../types';
import { PauseIcon, PlayIcon, RefreshCwIcon, BrainIcon, ChevronUpIcon, ChevronDownIcon } from './Icons';

interface TimerProps {
  session: FocusSession;
  onPause: () => void;
  onReset: () => void;
  onLogDistraction: (text: string) => void;
  onAdjust: (minutes: number) => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const Timer: React.FC<TimerProps> = ({ session, onPause, onReset, onLogDistraction, onAdjust }) => {
  const [distractionText, setDistractionText] = useState('');

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (distractionText.trim()) {
      onLogDistraction(distractionText.trim());
      setDistractionText('');
    }
  };

  if (!session.taskId) {
    return (
      <div className="text-center p-6 bg-[#060644] rounded-lg my-4 border-2 border-dashed border-[#69adaf]">
        <p className="text-[#69adaf] flex items-center justify-center">Select a task and press the <PlayIcon className="inline w-5 h-5 mx-2 text-[#ee6650]" /> icon to start a focus session.</p>
      </div>
    );
  }

  const percentage = (session.timeLeft / session.initialDuration) * 100;

  const getTitle = () => {
    if (session.mode === 'work') {
      return <>Focusing on: <span className="font-bold text-[#f7f7f7]">{session.taskText}</span></>;
    }
    return <span className="font-bold text-[#007370]">Time for a break!</span>;
  };

  const isAdjustable = !session.isActive && session.mode === 'work';
  const canDecrease = session.timeLeft > 5 * 60;
  const canIncrease = session.timeLeft < 90 * 60;
  
  const upButtonClasses = `text-[#69adaf] hover:text-[#f7f7f7] transition-opacity duration-200 ${isAdjustable && canIncrease ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;
  const downButtonClasses = `text-[#69adaf] hover:text-[#f7f7f7] transition-opacity duration-200 ${isAdjustable && canDecrease ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;
  
  return (
    <div className="my-6 p-6 bg-[#007370]/10 rounded-xl border border-[#69adaf] text-center">
      <p className="text-[#69adaf] mb-4 min-h-[4rem] flex items-center justify-center">{getTitle()}</p>
      <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto flex items-center justify-center">
        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
          <circle className="text-[#69adaf]/30" strokeWidth="7" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
          <circle
            className={session.mode === 'work' ? 'text-[#ee6650]' : 'text-[#007370]'}
            strokeWidth="7"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={(2 * Math.PI * 45) * (1 - percentage / 100)}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <button onClick={() => onAdjust(5)} className={upButtonClasses} aria-label="Increase timer by 5 minutes">
                <ChevronUpIcon className="w-8 h-8"/>
            </button>
            <span className="font-mono text-4xl sm:text-5xl text-[#f7f7f7] my-1">{formatTime(session.timeLeft)}</span>
            <button onClick={() => onAdjust(-5)} className={downButtonClasses} aria-label="Decrease timer by 5 minutes">
                <ChevronDownIcon className="w-8 h-8"/>
            </button>
        </div>
      </div>
      <div className="flex justify-center items-center space-x-6 mt-6">
        <button onClick={onReset} className="p-2 sm:p-3 rounded-full bg-[#69adaf]/20 hover:bg-[#69adaf]/40 transition-colors" aria-label="Reset timer">
            <RefreshCwIcon className="w-6 h-6 text-[#f7f7f7]" />
        </button>
        <button onClick={onPause} className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-[#ee6650] to-[#d95a46] text-[#f7f7f7] shadow-lg shadow-[#ee6650]/30 transform hover:scale-105 transition-transform" aria-label={session.isActive ? 'Pause timer' : 'Resume timer'}>
          {session.isActive ? <PauseIcon className="w-8 h-8 sm:w-10 sm:h-10" /> : <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 pl-1" />}
        </button>
         <div className="w-10 h-10 sm:w-12 sm:h-12" /> {/* Spacer to balance the layout */}
      </div>

      {session.mode === 'work' && (
        <div className="mt-8 border-t border-[#69adaf]/30 pt-6">
            <form onSubmit={handleLogSubmit}>
                <label htmlFor="distraction-input" className="flex items-center justify-center text-sm sm:text-md font-semibold text-[#69adaf] mb-3">
                    <BrainIcon className="w-5 h-5 mr-2"/>
                    Got a distracting thought?
                </label>
                <div className="flex items-center space-x-2">
                    <input 
                        id="distraction-input"
                        type="text"
                        value={distractionText}
                        onChange={(e) => setDistractionText(e.target.value)}
                        placeholder="Capture it here and stay focused."
                        className="flex-grow bg-transparent border-2 border-[#69adaf] rounded-lg py-2 px-3 text-[#f7f7f7] placeholder-[#69adaf]/70 focus:outline-none focus:ring-1 focus:ring-[#ee6650]"
                    />
                    <button 
                        type="submit" 
                        className="bg-[#69adaf]/30 text-[#f7f7f7] font-semibold py-2 px-4 rounded-lg hover:bg-[#69adaf]/50 transition-colors disabled:opacity-50"
                        disabled={!distractionText.trim()}
                    >
                        Log
                    </button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
};

export default Timer;
