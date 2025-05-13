
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'coordinator' | 'supervisor' | 'worker';
  password?: string; // Added password as optional
}

export interface SubTask {
  id: string;
  task_id: string;
  title: string;
  status: 'completed' | 'not-started' | 'in-progress';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assigned_to: string;
  projectId: string;
  project_id: string;
  projectStage: string;
  project_stage_id: string;
  status: 'not-started' | 'in-progress' | 'paused' | 'completed';
  priority: 'Alta' | 'Media' | 'Baja';
  dueDate: Date | string | null;
  due_date: Date | string | null;
  assignedDate: Date | string;
  assigned_date: Date | string;
  completedDate?: Date | string | null;
  completed_date?: Date | string | null;
  progress: number;
  subtasks: SubTask[];
  notes: Note[];
}

export type TaskStatus = Task['status'];

export interface Note {
  id: string;
  task_id: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  stages: string[];
  display_order?: number;
}

export interface Report {
  id: string;
  title: string;
  date: string;
  user_id: string;
  tasks: Task[];
  users?: {
    name: string;
  };
  message?: string;
  projectId?: string;
  project_id?: string;
  // Fields used in Reports.tsx
  completedTasks?: any[]; 
  completedSubtasks?: any[];
  userName?: string;
}
