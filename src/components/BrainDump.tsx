import React, { useState } from 'react';
import { BrainDumpTask } from '../types';
import { PlusIcon, TrashIcon, XIcon } from './Icons';

interface BrainDumpProps {
  tasks: BrainDumpTask[];
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (text: string) => void;
  onDeleteTask: (id: string) => void;
  onMoveToToday: (task: BrainDumpTask) => void;
}

const BrainDump: React.FC<BrainDumpProps> = ({ tasks, isOpen, onClose, onAddTask, onDeleteTask, onMoveToToday }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTask(text.trim());
      setText('');
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#060644] border-l-2 border-[#69adaf] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b border-[#69adaf]/50">
                <h2 className="text-2xl font-bold text-[#f7f7f7]">Brain Dump</h2>
                <button onClick={onClose} className="p-1 text-[#69adaf] hover:text-[#ee6650]">
                    <XIcon className="w-6 h-6" />
                </button>
            </header>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {tasks.length === 0 ? (
                    <p className="text-center text-[#69adaf] pt-8">A space for your fleeting thoughts. Jot down anything here.</p>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="flex items-center bg-[#007370]/20 p-3 rounded-lg">
                            <span className="flex-grow text-[#f7f7f7]">{task.text}</span>
                            <button onClick={() => onMoveToToday(task)} className="ml-2 p-2 text-[#69adaf] hover:text-[#f7f7f7]" aria-label="Move to today's list">
                                <PlusIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={() => onDeleteTask(task.id)} className="ml-1 p-2 text-[#69adaf] hover:text-[#ee6650]" aria-label="Delete task">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
            
            <div className="p-4 border-t border-[#69adaf]/50">
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Capture a thought..."
                        className="flex-grow bg-transparent border-2 border-[#69adaf] rounded-lg py-2 px-3 text-[#f7f7f7] placeholder-[#69adaf]/70 focus:outline-none focus:ring-1 focus:ring-[#ee6650]"
                    />
                    <button type="submit" className="p-2 bg-[#007370] rounded-lg text-white disabled:opacity-50" disabled={!text.trim()}>
                        <PlusIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
      </div>
    </>
  );
};

export default BrainDump;