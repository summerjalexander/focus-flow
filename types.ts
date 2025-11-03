export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id:string;
  text: string;
  completed: boolean;
  subtasks: Subtask[];
  category?: string;
  dueDate?: string;
  notes?: string;
}

export interface TasksByDate {
  [date: string]: Task[];
}

export interface FocusSession {
  isActive: boolean;
  mode: 'work' | 'break';
  timeLeft: number; // in seconds
  initialDuration: number; // in seconds
  taskId: string | null;
  taskText: string | null;
}

export interface BrainDumpTask {
  id: string;
  text: string;
}

export interface StreakData {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
}