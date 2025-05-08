
import { User, Task, Project, SubTask, Note, Report } from '@/types';

export interface AppContextProps {
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  projects: Project[];
  reports: Report[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCurrentUser: (user: User) => void;
  getUserByName: (name: string) => User | undefined;
  getUserById: (id: string) => User | undefined;
  getProjectById: (id: string) => Project | undefined;
  getFilteredTasks: (projectId?: string, assignedTo?: string) => Task[];
  getTasksInProgress: () => Task[];
  getCompletedTasksByDate: (date: Date) => Task[];
  addTask: (task: Omit<Task, 'id' | 'assignedDate' | 'progress'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  reassignTask: (taskId: string, newAssigneeId: string) => Promise<void>;
  addSubtask: (taskId: string, subtask: Omit<SubTask, 'id'>) => Promise<void>;
  updateSubtask: (taskId: string, subtask: SubTask) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addNote: (taskId: string, content: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  calculateTaskProgress: (task: Task) => number;
  generateReport: (taskId: string, message: string) => Promise<void>;
  getReports: () => Report[];
  loadInitialData: () => Promise<void>;
  dataLoaded: boolean;
}
