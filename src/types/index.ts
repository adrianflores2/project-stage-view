
export type UserRole = 'worker' | 'coordinator' | 'supervisor' | 'admin';

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
  position?: number; // Order within its stage
  
  // Supabase column names (snake_case)
  project_id?: string;
  project_stage_id?: string;
  assigned_to?: string;
  assigned_date?: string | Date;
  due_date?: string | Date;
  completed_date?: string | Date;
}

export interface Project {
  id: string;
  name: string;
  stages: string[];
  color: string;
  number?: number;
  client_name?: string;
  client_address?: string;
  description?: string;
}

// Updated Report type with projectId field
export interface Report {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  message: string;
  completedTasks: Task[];
  completedSubtasks: SubTask[];
  projectId?: string; // New field to link report to project
}

// Supabase database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: UserRole;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string;
          updated_at: string;
          number: number | null;
          client_name: string | null;
          client_address: string | null;
          description: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
          number?: number | null;
          client_name?: string | null;
          client_address?: string | null;
          description?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          updated_at?: string;
          number?: number | null;
          client_name?: string | null;
          client_address?: string | null;
          description?: string | null;
        };
      };
      project_stages: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          display_order?: number;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          assigned_to: string | null;
          project_id: string | null;
          project_stage_id: string | null;
          status: TaskStatus;
          progress: number;
          priority: 'Alta' | 'Media' | 'Baja' | null;
          assigned_date: string | null;
          due_date: string | null;
          completed_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          assigned_to?: string | null;
          project_id?: string | null;
          project_stage_id?: string | null;
          status?: TaskStatus;
          progress?: number;
          priority?: 'Alta' | 'Media' | 'Baja' | null;
          assigned_date?: string | null;
          due_date?: string | null;
          completed_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          assigned_to?: string | null;
          project_id?: string | null;
          project_stage_id?: string | null;
          status?: TaskStatus;
          progress?: number;
          priority?: 'Alta' | 'Media' | 'Baja' | null;
          assigned_date?: string | null;
          due_date?: string | null;
          completed_date?: string | null;
          updated_at?: string | null;
        };
      };
      reports: {
        Row: {
          id: string;
          user_id: string | null;
          date: string | null;
          message: string | null;
          project_id: string | null; // Added project_id field to match database change
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          date?: string | null;
          message?: string | null;
          project_id?: string | null; // Added project_id field for inserts
        };
        Update: {
          id?: string;
          user_id?: string | null;
          date?: string | null;
          message?: string | null;
          project_id?: string | null; // Added project_id field for updates
        };
      };
    };
  };
}
