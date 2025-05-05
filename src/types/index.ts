
export type UserRole = 'worker' | 'coordinator' | 'supervisor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string; // Added for authentication
}

export type TaskStatus = 'not-started' | 'in-progress' | 'paused' | 'completed';

export interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

export interface SubTask {
  id: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'completed';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  projectId: string;
  projectStage: string;
  status: TaskStatus;
  subtasks: SubTask[];
  notes: Note[];
  assignedDate: Date;
  dueDate?: Date;
  completedDate?: Date;
  progress: number; // 0-100
  priority?: 'Alta' | 'Media' | 'Baja'; // Added priority field
}

export interface Project {
  id: string;
  name: string;
  stages: string[];
  color: string;
}

// New Report type for worker-generated reports
export interface Report {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  message: string;
  completedTasks: Task[];
  completedSubtasks: SubTask[];
}
