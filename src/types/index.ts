
export type UserRole = 'worker' | 'coordinator' | 'supervisor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
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
}

export interface Project {
  id: string;
  name: string;
  stages: string[];
  color: string;
}
