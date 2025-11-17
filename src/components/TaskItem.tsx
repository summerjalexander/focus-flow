import React, { useState, KeyboardEvent, useEffect, useRef } from 'react';
import { Task } from '../types';
import { TrashIcon, PlayIcon, SparklesIcon, ChevronDownIcon, PlusIcon, FastForwardIcon, CalendarIcon, GripVerticalIcon } from './Icons';
import SubtaskItem from './SubtaskItem';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onStartTimer: (id: string, text: string) => void;
  onContinueTaskTomorrow: (id: string) => void;
  activeTaskId: string | null;
  onAddSubtask: (taskId: string, text: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId:string, subtaskId: string) => void;
  onGenerateSubtasks: (taskId: string, taskText: string) => Promise<void>;
  onSetTaskDueDate: (taskId: string, dueDate: string | null) => void;
  onUpdateTaskNotes: (taskId: string, notes: string) => void;
  draggedTaskId: string | null;
  setDraggedTaskId: (id: string | null) => void;
  onReorderTasks: (draggedId: string, droppedOnId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = (props) => {
  const { task, onToggleComplete, onDelete, onStartTimer, activeTaskId, onAddSubtask, onToggleSubtask, onDeleteSubtask, onGenerateSubtasks, onContinueTaskTomorrow, onSetTaskDueDate, onUpdateTaskNotes, draggedTaskId, setDraggedTaskId, onReorderTasks } = props;
  
  const isTimerActiveForThisTask = activeTaskId === task.id;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isQuickAddingSubtask, setIsQuickAddingSubtask] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [notesText, setNotesText] = useState(task.notes || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [isConfirmingMove, setIsConfirmingMove] = useState(false);
  const prevCompleted = useRef(task.completed);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (task.completed && !prevCompleted.current) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 1500);
      return () => clearTimeout(timer);
    }
    prevCompleted.current = task.completed;
  }, [task.completed]);

  useEffect(() => {
    setNotesText(task.notes || '');
  }, [task.notes]);
  
  const getDueDateInfo = (dueDateStr?: string): { text: string; color: string } | null => {
    if (!dueDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dueDateStr);
    dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset());
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Overdue`, color: 'text-red-400 font-semibold' };
    if (diffDays === 0) return { text: 'Due Today', color: 'text-orange-400 font-semibold' };
    if (diffDays === 1) return { text: 'Due Tomorrow', color: 'text-[#69adaf]' };
    return { text: `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, color: 'text-[#69adaf]' };
  };

  const dueDateInfo = getDueDateInfo(task.dueDate);

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSetTaskDueDate(task.id, e.target.value || null);
    setIsEditingDueDate(false);
  };

  const handleGenerateClick = async () => {
    setIsGenerating(true);
    await onGenerateSubtasks(task.id, task.text);
    setIsGenerating(false);
    if (!isExpanded) setIsExpanded(true);
  };

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      onAddSubtask(task.id, newSubtaskText.trim());
      setNewSubtaskText('');
      if (!isExpanded) setIsExpanded(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };
  
  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const isPartiallyComplete = task.subtasks.length > 0 && completedSubtasks > 0 && !task.completed;
  
  const toggleQuickAdd = () => setIsQuickAddingSubtask(prev => !prev);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (task.completed) return;
    e.dataTransfer.setData('taskId', task.id);
    setDraggedTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedTaskId && draggedTaskId !== task.id) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('taskId');
    if (draggedId && draggedId !== task.id) {
      onReorderTasks(draggedId, task.id);
    }
    handleDragEnd();
  };


  const subtaskInputForm = (
    <div className={`mt-2 ${isExpanded ? 'mb-3' : ''}`}>
        <div className="flex items-center space-x-2 pl-8">
            <input 
              type="text" 
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a smaller step..."
              className="flex-grow bg-transparent border-b border-[#69adaf]/50 py-1 text-sm text-[#f7f7f7] placeholder-[#69adaf]/70 focus:outline-none focus:border-[#ee6650]"
              autoFocus
            />
            <button onClick={handleAddSubtask} className="text-[#69adaf] hover:text-[#ee6650] p-1" aria-label="Confirm add subtask">
              <PlusIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={handleGenerateClick} 
              disabled={isGenerating}
              className="text-[#69adaf] hover:text-[#ee6650] p-1 disabled:opacity-50"
              title="Generate subtasks with AI"
            >
                <SparklesIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`}/>
            </button>
        </div>
    </div>
  );

  const getContainerClasses = () => {
    let baseClasses = 'rounded-lg transition-all duration-300 ease-in-out transform';
    if (isTimerActiveForThisTask) baseClasses += ' ring-2 ring-[#ee6650]';
    
    if (task.id === draggedTaskId) {
        return `${baseClasses} opacity-40 scale-105`;
    }
    
    if (justCompleted) return `${baseClasses} animate-celebrate scale-100`;
    if (task.completed) return `${baseClasses} bg-[#060644]/50 opacity-60 scale-95`;
    if (isPartiallyComplete) return `${baseClasses} bg-[#007370]/20 border-l-4 border-[#ee6650] scale-100`;

    if (isDragOver) {
        return `${baseClasses} bg-[#007370]/30 scale-105`;
    }

    return `${baseClasses} bg-[#007370]/20 scale-100`;
  };

  return (
    <div 
        className={getContainerClasses()}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      <div className="flex items-center p-4">
        <div 
            className={`p-1 text-gray-500 cursor-grab ${task.completed ? 'opacity-30 cursor-not-allowed' : 'hover:text-white'}`}
            draggable={!task.completed}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            aria-label={`Drag to reorder task: ${task.text}`}
        >
            <GripVerticalIcon className="w-5 h-5" />
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-[#69adaf] hover:text-[#f7f7f7]">
          <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${task.subtasks.length === 0 ? 'opacity-30' : ''}`} />
        </button>
        <label className="flex items-center cursor-pointer flex-grow ml-2">
          <div className="relative">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleComplete(task.id)}
              className="sr-only"
              disabled={isTimerActiveForThisTask}
            />
            <div className={`w-6 h-6 rounded-md border-2 transition-all duration-200 ${task.completed ? 'bg-[#007370] border-[#007370]' : 'border-[#69adaf] bg-[#060644]'}`}>
              {task.completed && (
                <svg className="w-full h-full text-[#f7f7f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path className="checkmark-path" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <div className="ml-4 flex-grow">
            <span className={`text-base sm:text-lg ${task.completed ? 'line-through text-[#69adaf]' : 'text-[#f7f7f7]'}`}>
              {task.text}
            </span>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-xs">
                {task.category && (
                  <span className={`font-semibold px-2 py-0.5 rounded-full ${task.completed ? 'bg-[#69adaf]/10 text-[#69adaf]/70' : 'bg-[#69adaf]/30 text-[#69adaf]'}`}>
                    {task.category}
                  </span>
                )}
                {isEditingDueDate ? (
                    <input
                        type="date"
                        defaultValue={task.dueDate}
                        onChange={handleDueDateChange}
                        onBlur={() => setIsEditingDueDate(false)}
                        autoFocus
                        className="bg-transparent border-b border-[#69adaf] text-xs text-[#f7f7f7] focus:outline-none p-0 [color-scheme:dark]"
                    />
                ) : (
                    <button onClick={(e) => { e.preventDefault(); setIsEditingDueDate(true); }} disabled={task.completed} className="flex items-center gap-1 disabled:opacity-50">
                        <CalendarIcon className={`w-4 h-4 ${dueDateInfo ? dueDateInfo.color : 'text-[#69adaf]'}`} />
                        {dueDateInfo ? (
                            <span className={dueDateInfo.color}>{dueDateInfo.text}</span>
                        ) : (
                           <span className="text-[#69adaf]">Add Due Date</span>
                        )}
                    </button>
                )}
                {task.subtasks.length > 0 && (
                    <span className="text-xs text-[#69adaf]">
                        {completedSubtasks}/{task.subtasks.length}
                    </span>
                )}
            </div>
          </div>
        </label>
        
        <div className="flex-shrink-0 flex items-center ml-2 space-x-0 sm:space-x-1">
            <button onClick={toggleQuickAdd} className="text-[#69adaf] hover:text-[#ee6650] transition-colors duration-200 p-2 disabled:opacity-50" disabled={task.completed} aria-label={`Add sub-task for: ${task.text}`} title="Add sub-task">
                <PlusIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onStartTimer(task.id, task.text)} className="text-[#69adaf] hover:text-[#ee6650] transition-colors duration-200 p-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={task.completed} aria-label={`Start focus timer for: ${task.text}`} title="Start focus timer">
              <PlayIcon className="w-5 h-5" />
            </button>
            {!task.completed && (
                <div className="relative">
                    <button 
                        onClick={() => setIsConfirmingMove(true)}
                        className="text-[#69adaf] hover:text-[#ee6650] transition-colors duration-200 p-2"
                        aria-label={`Continue task '${task.text}' tomorrow`}
                        title="Continue task tomorrow"
                    >
                        <FastForwardIcon className="w-5 h-5" />
                    </button>
                    {isConfirmingMove && (
                        <div className="absolute top-full right-0 mt-2 p-3 bg-[#060644] border border-[#69adaf] rounded-lg shadow-xl z-10 w-56 sm:w-64 text-left">
                            <p className="text-sm text-[#f7f7f7]">
                                {isPartiallyComplete
                                    ? "Continue this task tomorrow? Completed steps will stay on today's list."
                                    : "Move this task to tomorrow's list?"}
                            </p>
                            <div className="flex justify-end gap-2 mt-3">
                                <button 
                                    onClick={() => setIsConfirmingMove(false)} 
                                    className="px-3 py-1 text-xs rounded bg-[#69adaf]/20 hover:bg-[#69adaf]/40 text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        onContinueTaskTomorrow(task.id);
                                        setIsConfirmingMove(false);
                                    }}
                                    className="px-3 py-1 text-xs rounded bg-[#ee6650] hover:bg-[#d95a46] text-white"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <button onClick={() => onDelete(task.id)} className="text-[#69adaf] hover:text-[#ee6650] transition-colors duration-200 p-2" aria-label={`Delete task: ${task.text}`} title="Delete task">
              <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      
      {(isQuickAddingSubtask || isExpanded) && (
        <div className="px-4 pb-4 pt-2 border-t border-[#69adaf]/20">
          {isQuickAddingSubtask && !isExpanded && subtaskInputForm}
          {isExpanded && (
            <div>
              {subtaskInputForm}
              {task.subtasks.length > 0 ? (
                task.subtasks.map(subtask => (
                  <SubtaskItem key={subtask.id} subtask={subtask} onToggle={(id) => onToggleSubtask(task.id, id)} onDelete={(id) => onDeleteSubtask(task.id, id)} />
                ))
              ) : (
                <p className="text-sm text-center text-[#69adaf] py-2 pl-8">No sub-tasks yet. Add a smaller step!</p>
              )}
               <div className="mt-4 pl-8">
                  <label htmlFor={`notes-${task.id}`} className="text-sm font-semibold text-[#69adaf]">Notes</label>
                  <textarea
                      id={`notes-${task.id}`}
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      onBlur={() => onUpdateTaskNotes(task.id, notesText)}
                      placeholder="Add more details or context..."
                      className="mt-1 w-full bg-transparent border-2 border-[#69adaf]/50 rounded-lg py-2 px-3 text-sm text-[#f7f7f7] placeholder-[#69adaf]/70 focus:outline-none focus:ring-1 focus:ring-[#ee6650] h-24 resize-y"
                  />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskItem;
