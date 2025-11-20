import React, { useState } from 'react';
import { MAX_TASKS } from '../constants';
import { PlusIcon } from './Icons';

interface AddTaskFormProps {
  onAddTask: (text: string, category?: string, dueDate?: string) => void;
  taskCount: number;
  categories: string[];
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAddTask, taskCount, categories }) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const isOverLimit = taskCount >= MAX_TASKS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTask(text.trim(), category.trim(), dueDate);
      setText('');
      setCategory('');
      setDueDate('');
    }
  };

  return (
    <div className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={isOverLimit ? "Add another task..." : "Add a new priority..."}
                    className="flex-grow bg-transparent border-2 border-[#69adaf] rounded-lg py-3 px-4 text-[#f7f7f7] placeholder-[#69adaf]/70 focus:outline-none focus:ring-2 focus:ring-[#ee6650] focus:border-[#ee6650] transition duration-200"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="bg-gradient-to-r from-[#007370] to-[#ee6650] text-white font-bold p-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#008f8c] hover:to-[#ff7b66] transition-all duration-200 transform hover:scale-105 shadow-lg shadow-[#ee6650]/20"
                    aria-label="Add task"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Category (optional)"
                        list="category-suggestions"
                        className="w-full bg-transparent border-2 border-[#69adaf]/50 rounded-lg py-2 px-4 text-sm text-[#f7f7f7] placeholder-[#69adaf]/70 focus:outline-none focus:ring-1 focus:ring-[#ee6650] focus:border-[#ee6650] transition duration-200"
                    />
                    <datalist id="category-suggestions">
                        {categories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                </div>
                <div>
                        <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className={`min-w-0 w-full bg-transparent border-2 border-[#69adaf]/50 rounded-lg py-2 px-4 text-sm placeholder-[#69adaf]/70 focus:outline-none focus:ring-1 focus:ring-[#ee6650] focus:border-[#ee6650] transition duration-200 [color-scheme:dark] ${!dueDate ? 'text-[#69adaf]' : 'text-[#f7f7f7]'}`}
                    />
                </div>
            </div>
        </form>
    </div>
  );
};

export default AddTaskForm;
