import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TasksByDate, BrainDumpTask, Subtask, StreakData } from './types';
import { MAX_TASKS } from './constants';
import { getEncouragement, generateSubtasks } from './services/geminiService';
import Header from './components/Header';
import TaskList from './components/TaskList';
import AddTaskForm from './components/AddTaskForm';
import EncouragementModal from './components/EncouragementModal';
import ProgressBar from './components/ProgressBar';
import { ShareIcon } from './components/Icons';
import Timer from './components/Timer';
import useFocusTimer from './hooks/useFocusTimer';
import FloatingActionButton from './components/FloatingActionButton';
import BrainDump from './components/BrainDump';
import AmbientSounds from './components/AmbientSounds';
import ProgressCalendar from './components/ProgressCalendar';
import CategoryFilter from './components/CategoryFilter';
import CarryOverBanner from './components/CarryOverBanner';
import OverloadWarningModal from './components/OverloadWarningModal';

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>(() => JSON.parse(localStorage.getItem('tasksByDate') || '{}'));
  const [brainDumpTasks, setBrainDumpTasks] = useState<BrainDumpTask[]>(() => JSON.parse(localStorage.getItem('brainDumpTasks') || '[]'));
  const [streakData, setStreakData] = useState<StreakData>(() => JSON.parse(localStorage.getItem('streakData') || '{"current": 0, "longest": 0, "lastCompletedDate": null}'));
  const [dismissedCarryOverDates, setDismissedCarryOverDates] = useState<string[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [encouragement, setEncouragement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false);
  const [isSoundsOpen, setIsSoundsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Overload Warning State
  const [showOverloadWarning, setShowOverloadWarning] = useState(false);
  const [pendingTask, setPendingTask] = useState<{text: string, category?: string, dueDate?: string} | null>(null);

  const { focusSession, startTimer, pauseTimer, resetTimer, adjustTimer } = useFocusTimer();

  useEffect(() => { localStorage.setItem('tasksByDate', JSON.stringify(tasksByDate)); }, [tasksByDate]);
  useEffect(() => { localStorage.setItem('brainDumpTasks', JSON.stringify(brainDumpTasks)); }, [brainDumpTasks]);
  useEffect(() => { localStorage.setItem('streakData', JSON.stringify(streakData)); }, [streakData]);

  const dateKey = formatDate(currentDate);
  const currentTasks = tasksByDate[dateKey] || [];

  const updateTasksForDate = (date: string, newTasks: Task[]) => {
    setTasksByDate(prev => ({ ...prev, [date]: newTasks }));
  };
  
  // Streak Logic
  const updateStreak = useCallback(() => {
    const todayStr = formatDate(new Date());
    if (streakData.lastCompletedDate === todayStr) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);
    
    let newCurrent = 1;
    if (streakData.lastCompletedDate === yesterdayStr) {
      newCurrent = streakData.current + 1;
    }

    setStreakData({
        current: newCurrent,
        longest: Math.max(streakData.longest, newCurrent),
        lastCompletedDate: todayStr
    });
  }, [streakData]);

  // Shared function for completion logic
  const handleTaskCompletion = async (task: Task) => {
    updateStreak();
    setShowModal(true);
    setIsLoading(true);
    const message = await getEncouragement(task.text, task.subtasks);
    setEncouragement(message);
    setIsLoading(false);
  };

  const performAddTask = (text: string, category?: string, dueDate?: string) => {
      const newTask: Task = { 
        id: uuidv4(), 
        text, 
        completed: false, 
        subtasks: [], 
        category: category?.trim() ? category.trim() : undefined,
        dueDate: dueDate || undefined,
      };
      updateTasksForDate(dateKey, [...currentTasks, newTask]);
  }

  const handleAddTask = (text: string, category?: string, dueDate?: string) => {
    if (currentTasks.length >= MAX_TASKS) {
        setPendingTask({ text, category, dueDate });
        setShowOverloadWarning(true);
    } else {
        performAddTask(text, category, dueDate);
    }
  };

  const confirmOverloadTask = () => {
      if (pendingTask) {
          performAddTask(pendingTask.text, pendingTask.category, pendingTask.dueDate);
          setPendingTask(null);
      }
      setShowOverloadWarning(false);
  };

  const cancelOverloadTask = () => {
      setPendingTask(null);
      setShowOverloadWarning(false);
  };

  const handleToggleComplete = (id: string) => {
    if (focusSession.taskId === id) resetTimer();
    
    let taskJustCompleted = false;
    let completedTask: Task | undefined;
    const newTasks = currentTasks.map(task => {
      if (task.id === id) {
        const willBeCompleted = !task.completed;
        taskJustCompleted = willBeCompleted;
        const updatedTask = { 
          ...task, 
          completed: willBeCompleted,
          subtasks: task.subtasks.map(st => ({...st, completed: willBeCompleted}))
        };
        if (taskJustCompleted) {
            completedTask = updatedTask;
        }
        return updatedTask;
      }
      return task;
    });
    updateTasksForDate(dateKey, newTasks);

    if (taskJustCompleted && completedTask) {
      handleTaskCompletion(completedTask);
    }
  };

  const handleDeleteTask = (id: string) => {
    if (focusSession.taskId === id) resetTimer();
    updateTasksForDate(dateKey, currentTasks.filter(task => task.id !== id));
  };
  
  // Subtask handlers
  const handleAddSubtask = (taskId: string, text: string) => {
    const newSubtask: Subtask = { id: uuidv4(), text, completed: false };
    const newTasks = currentTasks.map(t => t.id === taskId ? {...t, subtasks: [...t.subtasks, newSubtask]} : t);
    updateTasksForDate(dateKey, newTasks);
  };
  
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const originalTask = currentTasks.find(t => t.id === taskId);
    if (!originalTask) return;

    const newTasks = currentTasks.map(task => {
      if (task.id === taskId) {
        const newSubtasks = task.subtasks.map(st => st.id === subtaskId ? {...st, completed: !st.completed} : st);
        const allSubtasksCompleted = newSubtasks.length > 0 && newSubtasks.every(st => st.completed);
        return {...task, subtasks: newSubtasks, completed: allSubtasksCompleted};
      }
      return task;
    });
    
    updateTasksForDate(dateKey, newTasks);
    
    const updatedTask = newTasks.find(t => t.id === taskId)!;
    if (updatedTask.completed && !originalTask.completed) {
        handleTaskCompletion(updatedTask);
    }
  };

  const handleSetTaskDueDate = (taskId: string, dueDate: string | null) => {
    const newTasks = currentTasks.map(task => 
      task.id === taskId ? { ...task, dueDate: dueDate || undefined } : task
    );
    updateTasksForDate(dateKey, newTasks);
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const newTasks = currentTasks.map(t => t.id === taskId ? {...t, subtasks: t.subtasks.filter(st => st.id !== subtaskId)} : t);
    updateTasksForDate(dateKey, newTasks);
  };
  
  const handleGenerateSubtasks = async (taskId: string, taskText: string) => {
    const subs = await generateSubtasks(taskText);
    if (subs.length > 0) {
      const newSubtasks: Subtask[] = subs.map(text => ({ id: uuidv4(), text, completed: false }));
      const newTasks = currentTasks.map(t => t.id === taskId ? {...t, subtasks: [...t.subtasks, ...newSubtasks]} : t);
      updateTasksForDate(dateKey, newTasks);
    }
  };
  
  const handleUpdateTaskNotes = (taskId: string, notes: string) => {
    const newTasks = currentTasks.map(task =>
      task.id === taskId ? { ...task, notes: notes } : task
    );
    updateTasksForDate(dateKey, newTasks);
  };

  // Brain Dump Handlers
  const handleAddBrainDumpTask = (text: string) => {
    setBrainDumpTasks(prev => [...prev, { id: uuidv4(), text }]);
  };
  const handleDeleteBrainDumpTask = (id: string) => {
    setBrainDumpTasks(prev => prev.filter(t => t.id !== id));
  };
  const handleMoveBrainDumpToToday = (task: BrainDumpTask) => {
    handleAddTask(task.text);
    handleDeleteBrainDumpTask(task.id);
  };

  const handleContinueTaskTomorrow = (taskId: string) => {
    const taskToMove = currentTasks.find(t => t.id === taskId);
    if (!taskToMove || taskToMove.completed) return;

    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateKey = formatDate(tomorrow);
    const tomorrowTasks = tasksByDate[tomorrowDateKey] || [];

    // Logic for moving partial or full task
    const completedSubtasks = taskToMove.subtasks.filter(st => st.completed);
    const incompleteSubtasks = taskToMove.subtasks.filter(st => !st.completed);

    // Case 1: Task has progress, so split it.
    if (completedSubtasks.length > 0 && incompleteSubtasks.length > 0) {
        // New task for tomorrow with remaining work
        const taskForTomorrow: Task = {
            ...taskToMove,
            id: uuidv4(),
            completed: false,
            subtasks: incompleteSubtasks.map(st => ({...st, id: uuidv4()})),
        };
        updateTasksForDate(tomorrowDateKey, [...tomorrowTasks, taskForTomorrow]);

        // Update today's task to reflect completed progress
        const updatedTodayTask: Task = {
            ...taskToMove,
            text: `${taskToMove.text} (Done for today)`,
            completed: true,
            subtasks: completedSubtasks,
        };
        const newTodayTasks = currentTasks.map(t => t.id === taskId ? updatedTodayTask : t);
        updateTasksForDate(dateKey, newTodayTasks);
        handleTaskCompletion(updatedTodayTask);
    } else { // Case 2: No progress or no subtasks, move the whole thing.
        const taskForTomorrow: Task = { ...taskToMove, id: uuidv4(), completed: false };
        updateTasksForDate(tomorrowDateKey, [...tomorrowTasks, taskForTomorrow]);
        // And remove from today
        updateTasksForDate(dateKey, currentTasks.filter(t => t.id !== taskId));
    }
  };


  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    handleSetDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    handleSetDate(newDate);
  };
  
  const handleSetDate = (date: Date) => {
    resetTimer();
    setActiveCategory(null);
    setCurrentDate(date);
  };

  const carryOverSource = useMemo(() => {
    const previousDateKeys = Object.keys(tasksByDate)
      .filter(key => key < dateKey && !dismissedCarryOverDates.includes(key))
      .sort()
      .reverse();

    for (const prevDateKey of previousDateKeys) {
      const unfinishedTasks = (tasksByDate[prevDateKey] || []).filter(task => !task.completed);
      if (unfinishedTasks.length > 0) {
        return {
          dateKey: prevDateKey,
          date: new Date(prevDateKey + 'T12:00:00'), // Use noon to avoid timezone day-off issues
          tasks: unfinishedTasks,
        };
      }
    }
    return null;
  }, [tasksByDate, dateKey, dismissedCarryOverDates]);

  const handleCarryOverTasks = useCallback(() => {
    if (!carryOverSource) return;

    const sourceDateKey = carryOverSource.dateKey;
    const tasksToMove = carryOverSource.tasks.map(task => ({
         ...task, 
         id: uuidv4(), 
         subtasks: task.subtasks.map(st => ({ ...st, id: uuidv4() })) 
    }));

    setTasksByDate(prev => {
        const currentTodayTasks = prev[dateKey] || [];
        const sourceDateTasks = prev[sourceDateKey] || [];
        
        // Keep only completed tasks in the source date
        const newSourceTasks = sourceDateTasks.filter(t => t.completed);
        
        // Add moved tasks to today
        const newTodayTasks = [...currentTodayTasks, ...tasksToMove];

        return {
            ...prev,
            [dateKey]: newTodayTasks,
            [sourceDateKey]: newSourceTasks
        };
    });
  }, [carryOverSource, dateKey]);

  const handleDismissCarryOver = useCallback(() => {
      if (carryOverSource) {
          setDismissedCarryOverDates(prev => [...prev, carryOverSource.dateKey]);
      }
  }, [carryOverSource]);
  
  const getCarryOverMessage = useCallback(() => {
    if (!carryOverSource) return '';

    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    
    const sourceDate = carryOverSource.date;
    
    let dateText = '';
    if (formatDate(sourceDate) === formatDate(yesterday)) {
        dateText = 'from yesterday';
    } else {
        dateText = `from ${sourceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    }
    
    const count = carryOverSource.tasks.length;

    return `Move ${count} unfinished task${count > 1 ? 's' : ''} ${dateText} to today?`;
  }, [carryOverSource, currentDate]);

  const handleShareProgress = async () => {
    const dateString = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const completedCount = currentTasks.filter(t => t.completed).length;
    const totalCount = currentTasks.length;

    let shareText = `My Focus Flow Progress for ${dateString}\n`;
    shareText += `Completed ${completedCount} of ${totalCount} tasks!\n\n`;

    if (totalCount > 0) {
        const completedTasks = currentTasks.filter(t => t.completed);
        if (completedTasks.length > 0) {
            shareText += "✅ Completed:\n";
            completedTasks.forEach(task => { shareText += `- ${task.text}\n`; });
        }

        const incompleteTasks = currentTasks.filter(t => !t.completed);
        if (incompleteTasks.length > 0) {
            shareText += "\n◻️ To Do:\n";
            incompleteTasks.forEach(task => { shareText += `- ${task.text}\n`; });
        }
    } else {
        shareText += "No tasks for today."
    }
    
    shareText += "\nShared from the Focus Flow app."

    if (navigator.share) {
        try {
            await navigator.share({
                title: `Focus Flow Progress for ${dateString}`,
                text: shareText,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        const mailtoLink = `mailto:?subject=${encodeURIComponent(`Focus Flow Progress for ${dateString}`)}&body=${encodeURIComponent(shareText)}`;
        window.location.href = mailtoLink;
    }
  };
  
  // Drag and Drop Reordering
  const handleReorderTasks = (draggedId: string, droppedOnId: string) => {
    const draggedIndex = currentTasks.findIndex(t => t.id === draggedId);
    const droppedIndex = currentTasks.findIndex(t => t.id === droppedOnId);
    
    if (draggedIndex === -1 || droppedIndex === -1 || draggedIndex === droppedIndex) return;

    const newTasks = [...currentTasks];
    const [reorderedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(droppedIndex, 0, reorderedTask);
    
    updateTasksForDate(dateKey, newTasks);
  };

  const completedCount = currentTasks.filter(t => t.completed).length;

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    Object.values(tasksByDate).flat().forEach((task: Task) => {
        if (task.category) {
            categories.add(task.category);
        }
    });
    return Array.from(categories).sort();
  }, [tasksByDate]);

  const filteredTasks = useMemo(() => {
    if (!activeCategory) {
        return currentTasks;
    }
    return currentTasks.filter(task => task.category === activeCategory);
  }, [currentTasks, activeCategory]);

  return (
    <div className="min-h-screen bg-[#060644] text-[#f7f7f7] p-4 sm:p-6 flex flex-col items-center">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,115,112,0.3),rgba(255,255,255,0))]"></div>
      
      <div className="w-full max-w-2xl z-10">
        <Header 
            currentDate={currentDate} 
            onPrevDay={handlePrevDay} 
            onNextDay={handleNextDay} 
            onSetDate={handleSetDate}
            streak={streakData.current} 
            tasksByDate={tasksByDate}
        />
        
        <main className="bg-[#060644]/50 backdrop-blur-sm border border-[#69adaf]/50 rounded-xl p-4 sm:p-6 shadow-2xl shadow-black/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#69adaf]">Daily Priorities</h3>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleShareProgress}
                    className="p-1.5 rounded-full bg-[#69adaf]/20 hover:bg-[#69adaf]/40 transition-colors duration-200"
                    aria-label="Share progress for today"
                    title="Share progress for today"
                >
                    <ShareIcon className="w-5 h-5" />
                </button>
                <p className="font-mono text-sm bg-[#007370]/50 text-[#f7f7f7] px-2 py-1 rounded">{completedCount}/{currentTasks.length}</p>
            </div>
          </div>
          <ProgressBar completed={completedCount} total={currentTasks.length} />

          <Timer 
            session={focusSession} 
            onPause={pauseTimer} 
            onReset={resetTimer} 
            onLogDistraction={handleAddBrainDumpTask} 
            onAdjust={adjustTimer}
          />
          
          <CategoryFilter
            categories={allCategories.filter(c => currentTasks.some(t => t.category === c))}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />

          <TaskList
            tasks={filteredTasks}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDeleteTask}
            onStartTimer={startTimer}
            activeTaskId={focusSession.taskId}
            onAddSubtask={handleAddSubtask}
            onToggleSubtask={handleToggleSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onGenerateSubtasks={handleGenerateSubtasks}
            onContinueTaskTomorrow={handleContinueTaskTomorrow}
            onSetTaskDueDate={handleSetTaskDueDate}
            onUpdateTaskNotes={handleUpdateTaskNotes}
            onReorderTasks={handleReorderTasks}
          />

          <AddTaskForm onAddTask={handleAddTask} taskCount={currentTasks.length} categories={allCategories} />
          
          {carryOverSource && (
              <CarryOverBanner 
                  message={getCarryOverMessage()}
                  onCarryOver={handleCarryOverTasks}
                  onDismiss={handleDismissCarryOver}
              />
          )}
        </main>
      </div>

      <FloatingActionButton 
        onToggleBrainDump={() => setIsBrainDumpOpen(true)}
        onToggleSounds={() => setIsSoundsOpen(true)}
        onToggleCalendar={() => setIsCalendarOpen(true)}
      />

      <BrainDump 
        tasks={brainDumpTasks}
        isOpen={isBrainDumpOpen}
        onClose={() => setIsBrainDumpOpen(false)}
        onAddTask={handleAddBrainDumpTask}
        onDeleteTask={handleDeleteBrainDumpTask}
        onMoveToToday={handleMoveBrainDumpToToday}
      />
      
      <AmbientSounds isOpen={isSoundsOpen} onClose={() => setIsSoundsOpen(false)} />
      
      <ProgressCalendar 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        tasksByDate={tasksByDate} 
        currentDate={currentDate} 
        onSelectDate={handleSetDate}
      />

      {showModal && (
        <EncouragementModal isLoading={isLoading} message={encouragement} onClose={() => setShowModal(false)} />
      )}

      <OverloadWarningModal 
        isOpen={showOverloadWarning}
        onConfirm={confirmOverloadTask}
        onCancel={cancelOverloadTask}
      />
    </div>
  );
};

export default App;
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TasksByDate, BrainDumpTask, Subtask, StreakData } from './types';
import { MAX_TASKS } from './constants';
import { getEncouragement, generateSubtasks } from './services/geminiService';
import Header from './components/Header';
import TaskList from './components/TaskList';
import AddTaskForm from './components/AddTaskForm';
import EncouragementModal from './components/EncouragementModal';
import ProgressBar from './components/ProgressBar';
import { ShareIcon } from './components/Icons';
import Timer from './components/Timer';
import useFocusTimer from './hooks/useFocusTimer';
import FloatingActionButton from './components/FloatingActionButton';
import BrainDump from './components/BrainDump';
import AmbientSounds from './components/AmbientSounds';
import ProgressCalendar from './components/ProgressCalendar';
import CategoryFilter from './components/CategoryFilter';
import CarryOverBanner from './components/CarryOverBanner';
import OverloadWarningModal from './components/OverloadWarningModal';

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>(() => JSON.parse(localStorage.getItem('tasksByDate') || '{}'));
  const [brainDumpTasks, setBrainDumpTasks] = useState<BrainDumpTask[]>(() => JSON.parse(localStorage.getItem('brainDumpTasks') || '[]'));
  const [streakData, setStreakData] = useState<StreakData>(() => JSON.parse(localStorage.getItem('streakData') || '{"current": 0, "longest": 0, "lastCompletedDate": null}'));
  const [dismissedCarryOverDates, setDismissedCarryOverDates] = useState<string[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [encouragement, setEncouragement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false);
  const [isSoundsOpen, setIsSoundsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Overload Warning State
  const [showOverloadWarning, setShowOverloadWarning] = useState(false);
  const [pendingTask, setPendingTask] = useState<{text: string, category?: string, dueDate?: string} | null>(null);

  const { focusSession, startTimer, pauseTimer, resetTimer, adjustTimer } = useFocusTimer();

  useEffect(() => { localStorage.setItem('tasksByDate', JSON.stringify(tasksByDate)); }, [tasksByDate]);
  useEffect(() => { localStorage.setItem('brainDumpTasks', JSON.stringify(brainDumpTasks)); }, [brainDumpTasks]);
  useEffect(() => { localStorage.setItem('streakData', JSON.stringify(streakData)); }, [streakData]);

  const dateKey = formatDate(currentDate);
  const currentTasks = tasksByDate[dateKey] || [];

  const updateTasksForDate = (date: string, newTasks: Task[]) => {
    setTasksByDate(prev => ({ ...prev, [date]: newTasks }));
  };
  
  // Streak Logic
  const updateStreak = useCallback(() => {
    const todayStr = formatDate(new Date());
    if (streakData.lastCompletedDate === todayStr) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);
    
    let newCurrent = 1;
    if (streakData.lastCompletedDate === yesterdayStr) {
      newCurrent = streakData.current + 1;
    }

    setStreakData({
        current: newCurrent,
        longest: Math.max(streakData.longest, newCurrent),
        lastCompletedDate: todayStr
    });
  }, [streakData]);

  // Shared function for completion logic
  const handleTaskCompletion = async (task: Task) => {
    updateStreak();
    setShowModal(true);
    setIsLoading(true);
    const message = await getEncouragement(task.text, task.subtasks);
    setEncouragement(message);
    setIsLoading(false);
  };

  const performAddTask = (text: string, category?: string, dueDate?: string) => {
      const newTask: Task = { 
        id: uuidv4(), 
        text, 
        completed: false, 
        subtasks: [], 
        category: category?.trim() ? category.trim() : undefined,
        dueDate: dueDate || undefined,
      };
      updateTasksForDate(dateKey, [...currentTasks, newTask]);
  }

  const handleAddTask = (text: string, category?: string, dueDate?: string) => {
    if (currentTasks.length >= MAX_TASKS) {
        setPendingTask({ text, category, dueDate });
        setShowOverloadWarning(true);
    } else {
        performAddTask(text, category, dueDate);
    }
  };

  const confirmOverloadTask = () => {
      if (pendingTask) {
          performAddTask(pendingTask.text, pendingTask.category, pendingTask.dueDate);
          setPendingTask(null);
      }
      setShowOverloadWarning(false);
  };

  const cancelOverloadTask = () => {
      setPendingTask(null);
      setShowOverloadWarning(false);
  };

  const handleToggleComplete = (id: string) => {
    if (focusSession.taskId === id) resetTimer();
    
    let taskJustCompleted = false;
    let completedTask: Task | undefined;
    const newTasks = currentTasks.map(task => {
      if (task.id === id) {
        const willBeCompleted = !task.completed;
        taskJustCompleted = willBeCompleted;
        const updatedTask = { 
          ...task, 
          completed: willBeCompleted,
          subtasks: task.subtasks.map(st => ({...st, completed: willBeCompleted}))
        };
        if (taskJustCompleted) {
            completedTask = updatedTask;
        }
        return updatedTask;
      }
      return task;
    });
    updateTasksForDate(dateKey, newTasks);

    if (taskJustCompleted && completedTask) {
      handleTaskCompletion(completedTask);
    }
  };

  const handleDeleteTask = (id: string) => {
    if (focusSession.taskId === id) resetTimer();
    updateTasksForDate(dateKey, currentTasks.filter(task => task.id !== id));
  };
  
  // Subtask handlers
  const handleAddSubtask = (taskId: string, text: string) => {
    const newSubtask: Subtask = { id: uuidv4(), text, completed: false };
    const newTasks = currentTasks.map(t => t.id === taskId ? {...t, subtasks: [...t.subtasks, newSubtask]} : t);
    updateTasksForDate(dateKey, newTasks);
  };
  
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const originalTask = currentTasks.find(t => t.id === taskId);
    if (!originalTask) return;

    const newTasks = currentTasks.map(task => {
      if (task.id === taskId) {
        const newSubtasks = task.subtasks.map(st => st.id === subtaskId ? {...st, completed: !st.completed} : st);
        const allSubtasksCompleted = newSubtasks.length > 0 && newSubtasks.every(st => st.completed);
        return {...task, subtasks: newSubtasks, completed: allSubtasksCompleted};
      }
      return task;
    });
    
    updateTasksForDate(dateKey, newTasks);
    
    const updatedTask = newTasks.find(t => t.id === taskId)!;
    if (updatedTask.completed && !originalTask.completed) {
        handleTaskCompletion(updatedTask);
    }
  };

  const handleSetTaskDueDate = (taskId: string, dueDate: string | null) => {
    const newTasks = currentTasks.map(task => 
      task.id === taskId ? { ...task, dueDate: dueDate || undefined } : task
    );
    updateTasksForDate(dateKey, newTasks);
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const newTasks = currentTasks.map(t => t.id === taskId ? {...t, subtasks: t.subtasks.filter(st => st.id !== subtaskId)} : t);
    updateTasksForDate(dateKey, newTasks);
  };
  
  const handleGenerateSubtasks = async (taskId: string, taskText: string) => {
    const subs = await generateSubtasks(taskText);
    if (subs.length > 0) {
      const newSubtasks: Subtask[] = subs.map(text => ({ id: uuidv4(), text, completed: false }));
      const newTasks = currentTasks.map(t => t.id === taskId ? {...t, subtasks: [...t.subtasks, ...newSubtasks]} : t);
      updateTasksForDate(dateKey, newTasks);
    }
  };
  
  const handleUpdateTaskNotes = (taskId: string, notes: string) => {
    const newTasks = currentTasks.map(task =>
      task.id === taskId ? { ...task, notes: notes } : task
    );
    updateTasksForDate(dateKey, newTasks);
  };

  // Brain Dump Handlers
  const handleAddBrainDumpTask = (text: string) => {
    setBrainDumpTasks(prev => [...prev, { id: uuidv4(), text }]);
  };
  const handleDeleteBrainDumpTask = (id: string) => {
    setBrainDumpTasks(prev => prev.filter(t => t.id !== id));
  };
  const handleMoveBrainDumpToToday = (task: BrainDumpTask) => {
    handleAddTask(task.text);
    handleDeleteBrainDumpTask(task.id);
  };

  const handleContinueTaskTomorrow = (taskId: string) => {
    const taskToMove = currentTasks.find(t => t.id === taskId);
    if (!taskToMove || taskToMove.completed) return;

    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateKey = formatDate(tomorrow);
    const tomorrowTasks = tasksByDate[tomorrowDateKey] || [];

    // Logic for moving partial or full task
    const completedSubtasks = taskToMove.subtasks.filter(st => st.completed);
    const incompleteSubtasks = taskToMove.subtasks.filter(st => !st.completed);

    // Case 1: Task has progress, so split it.
    if (completedSubtasks.length > 0 && incompleteSubtasks.length > 0) {
        // New task for tomorrow with remaining work
        const taskForTomorrow: Task = {
            ...taskToMove,
            id: uuidv4(),
            completed: false,
            subtasks: incompleteSubtasks.map(st => ({...st, id: uuidv4()})),
        };
        updateTasksForDate(tomorrowDateKey, [...tomorrowTasks, taskForTomorrow]);

        // Update today's task to reflect completed progress
        const updatedTodayTask: Task = {
            ...taskToMove,
            text: `${taskToMove.text} (Done for today)`,
            completed: true,
            subtasks: completedSubtasks,
        };
        const newTodayTasks = currentTasks.map(t => t.id === taskId ? updatedTodayTask : t);
        updateTasksForDate(dateKey, newTodayTasks);
        handleTaskCompletion(updatedTodayTask);
    } else { // Case 2: No progress or no subtasks, move the whole thing.
        const taskForTomorrow: Task = { ...taskToMove, id: uuidv4(), completed: false };
        updateTasksForDate(tomorrowDateKey, [...tomorrowTasks, taskForTomorrow]);
        // And remove from today
        updateTasksForDate(dateKey, currentTasks.filter(t => t.id !== taskId));
    }
  };


  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    handleSetDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    handleSetDate(newDate);
  };
  
  const handleSetDate = (date: Date) => {
    resetTimer();
    setActiveCategory(null);
    setCurrentDate(date);
  };

  const carryOverSource = useMemo(() => {
    const previousDateKeys = Object.keys(tasksByDate)
      .filter(key => key < dateKey && !dismissedCarryOverDates.includes(key))
      .sort()
      .reverse();

    for (const prevDateKey of previousDateKeys) {
      const unfinishedTasks = (tasksByDate[prevDateKey] || []).filter(task => !task.completed);
      if (unfinishedTasks.length > 0) {
        return {
          dateKey: prevDateKey,
          date: new Date(prevDateKey + 'T12:00:00'), // Use noon to avoid timezone day-off issues
          tasks: unfinishedTasks,
        };
      }
    }
    return null;
  }, [tasksByDate, dateKey, dismissedCarryOverDates]);

  const handleCarryOverTasks = useCallback(() => {
    if (!carryOverSource) return;

    const sourceDateKey = carryOverSource.dateKey;
    const tasksToMove = carryOverSource.tasks.map(task => ({
         ...task, 
         id: uuidv4(), 
         subtasks: task.subtasks.map(st => ({ ...st, id: uuidv4() })) 
    }));

    setTasksByDate(prev => {
        const currentTodayTasks = prev[dateKey] || [];
        const sourceDateTasks = prev[sourceDateKey] || [];
        
        // Keep only completed tasks in the source date
        const newSourceTasks = sourceDateTasks.filter(t => t.completed);
        
        // Add moved tasks to today
        const newTodayTasks = [...currentTodayTasks, ...tasksToMove];

        return {
            ...prev,
            [dateKey]: newTodayTasks,
            [sourceDateKey]: newSourceTasks
        };
    });
  }, [carryOverSource, dateKey]);

  const handleDismissCarryOver = useCallback(() => {
      if (carryOverSource) {
          setDismissedCarryOverDates(prev => [...prev, carryOverSource.dateKey]);
      }
  }, [carryOverSource]);
  
  const getCarryOverMessage = useCallback(() => {
    if (!carryOverSource) return '';

    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    
    const sourceDate = carryOverSource.date;
    
    let dateText = '';
    if (formatDate(sourceDate) === formatDate(yesterday)) {
        dateText = 'from yesterday';
    } else {
        dateText = `from ${sourceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    }
    
    const count = carryOverSource.tasks.length;

    return `Move ${count} unfinished task${count > 1 ? 's' : ''} ${dateText} to today?`;
  }, [carryOverSource, currentDate]);

  const handleShareProgress = async () => {
    const dateString = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const completedCount = currentTasks.filter(t => t.completed).length;
    const totalCount = currentTasks.length;

    let shareText = `My Focus Flow Progress for ${dateString}\n`;
    shareText += `Completed ${completedCount} of ${totalCount} tasks!\n\n`;

    if (totalCount > 0) {
        const completedTasks = currentTasks.filter(t => t.completed);
        if (completedTasks.length > 0) {
            shareText += "✅ Completed:\n";
            completedTasks.forEach(task => { shareText += `- ${task.text}\n`; });
        }

        const incompleteTasks = currentTasks.filter(t => !t.completed);
        if (incompleteTasks.length > 0) {
            shareText += "\n◻️ To Do:\n";
            incompleteTasks.forEach(task => { shareText += `- ${task.text}\n`; });
        }
    } else {
        shareText += "No tasks for today."
    }
    
    shareText += "\nShared from the Focus Flow app."

    if (navigator.share) {
        try {
            await navigator.share({
                title: `Focus Flow Progress for ${dateString}`,
                text: shareText,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        const mailtoLink = `mailto:?subject=${encodeURIComponent(`Focus Flow Progress for ${dateString}`)}&body=${encodeURIComponent(shareText)}`;
        window.location.href = mailtoLink;
    }
  };
  
  // Drag and Drop Reordering
  const handleReorderTasks = (draggedId: string, droppedOnId: string) => {
    const draggedIndex = currentTasks.findIndex(t => t.id === draggedId);
    const droppedIndex = currentTasks.findIndex(t => t.id === droppedOnId);
    
    if (draggedIndex === -1 || droppedIndex === -1 || draggedIndex === droppedIndex) return;

    const newTasks = [...currentTasks];
    const [reorderedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(droppedIndex, 0, reorderedTask);
    
    updateTasksForDate(dateKey, newTasks);
  };

  const completedCount = currentTasks.filter(t => t.completed).length;

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    Object.values(tasksByDate).flat().forEach((task: Task) => {
        if (task.category) {
            categories.add(task.category);
        }
    });
    return Array.from(categories).sort();
  }, [tasksByDate]);

  const filteredTasks = useMemo(() => {
    if (!activeCategory) {
        return currentTasks;
    }
    return currentTasks.filter(task => task.category === activeCategory);
  }, [currentTasks, activeCategory]);

  return (
    <div className="min-h-screen bg-[#060644] text-[#f7f7f7] p-4 sm:p-6 flex flex-col items-center">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,115,112,0.3),rgba(255,255,255,0))]"></div>
      
      <div className="w-full max-w-2xl z-10">
        <Header 
            currentDate={currentDate} 
            onPrevDay={handlePrevDay} 
            onNextDay={handleNextDay} 
            onSetDate={handleSetDate}
            streak={streakData.current} 
            tasksByDate={tasksByDate}
        />
        
        <main className="bg-[#060644]/50 backdrop-blur-sm border border-[#69adaf]/50 rounded-xl p-4 sm:p-6 shadow-2xl shadow-black/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#69adaf]">Daily Priorities</h3>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleShareProgress}
                    className="p-1.5 rounded-full bg-[#69adaf]/20 hover:bg-[#69adaf]/40 transition-colors duration-200"
                    aria-label="Share progress for today"
                    title="Share progress for today"
                >
                    <ShareIcon className="w-5 h-5" />
                </button>
                <p className="font-mono text-sm bg-[#007370]/50 text-[#f7f7f7] px-2 py-1 rounded">{completedCount}/{currentTasks.length}</p>
            </div>
          </div>
          <ProgressBar completed={completedCount} total={currentTasks.length} />

          <Timer 
            session={focusSession} 
            onPause={pauseTimer} 
            onReset={resetTimer} 
            onLogDistraction={handleAddBrainDumpTask} 
            onAdjust={adjustTimer}
          />
          
          <CategoryFilter
            categories={allCategories.filter(c => currentTasks.some(t => t.category === c))}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />

          <TaskList
            tasks={filteredTasks}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDeleteTask}
            onStartTimer={startTimer}
            activeTaskId={focusSession.taskId}
            onAddSubtask={handleAddSubtask}
            onToggleSubtask={handleToggleSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onGenerateSubtasks={handleGenerateSubtasks}
            onContinueTaskTomorrow={handleContinueTaskTomorrow}
            onSetTaskDueDate={handleSetTaskDueDate}
            onUpdateTaskNotes={handleUpdateTaskNotes}
            onReorderTasks={handleReorderTasks}
          />

          <AddTaskForm onAddTask={handleAddTask} taskCount={currentTasks.length} categories={allCategories} />
          
          {carryOverSource && (
              <CarryOverBanner 
                  message={getCarryOverMessage()}
                  onCarryOver={handleCarryOverTasks}
                  onDismiss={handleDismissCarryOver}
              />
          )}
        </main>
      </div>

      <FloatingActionButton 
        onToggleBrainDump={() => setIsBrainDumpOpen(true)}
        onToggleSounds={() => setIsSoundsOpen(true)}
        onToggleCalendar={() => setIsCalendarOpen(true)}
      />

      <BrainDump 
        tasks={brainDumpTasks}
        isOpen={isBrainDumpOpen}
        onClose={() => setIsBrainDumpOpen(false)}
        onAddTask={handleAddBrainDumpTask}
        onDeleteTask={handleDeleteBrainDumpTask}
        onMoveToToday={handleMoveBrainDumpToToday}
      />
      
      <AmbientSounds isOpen={isSoundsOpen} onClose={() => setIsSoundsOpen(false)} />
      
      <ProgressCalendar 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        tasksByDate={tasksByDate} 
        currentDate={currentDate} 
        onSelectDate={handleSetDate}
      />

      {showModal && (
        <EncouragementModal isLoading={isLoading} message={encouragement} onClose={() => setShowModal(false)} />
      )}

      <OverloadWarningModal 
        isOpen={showOverloadWarning}
        onConfirm={confirmOverloadTask}
        onCancel={cancelOverloadTask}
      />
    </div>
  );
};

export default App;
