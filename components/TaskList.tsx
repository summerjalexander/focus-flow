import React from 'react';
import { Task } from '../types.ts';
import TaskItem from './TaskItem.tsx';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onStartTimer: (id: string, text: string) => void;
  onContinueTaskTomorrow: (id: string) => void;
  activeTaskId: string | null;
  onAddSubtask: (taskId: string, text: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onGenerateSubtasks: (taskId: string, taskText: string) => Promise<void>;
  onSetTaskDueDate: (taskId: string, dueDate: string | null) => void;
  onUpdateTaskNotes: (taskId: string, notes: string) => void;
}

const TaskList: React.FC<TaskListProps> = (props) => {
  const { tasks, onToggleComplete, onDelete, onStartTimer, activeTaskId, onAddSubtask, onToggleSubtask, onDeleteSubtask, onGenerateSubtasks, onContinueTaskTomorrow, onSetTaskDueDate, onUpdateTaskNotes } = props;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-[#060644]/50 rounded-lg border-2 border-dashed border-[#69adaf]">
        <h3 className="text-xl font-semibold text-[#f7f7f7]">No priorities set for today.</h3>
        <p className="text-[#69adaf] mt-2">What's your number one focus?</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onStartTimer={onStartTimer}
          activeTaskId={activeTaskId}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onGenerateSubtasks={onGenerateSubtasks}
          onContinueTaskTomorrow={onContinueTaskTomorrow}
          onSetTaskDueDate={onSetTaskDueDate}
          onUpdateTaskNotes={onUpdateTaskNotes}
        />
      ))}
    </div>
  );
};

export default TaskList;
