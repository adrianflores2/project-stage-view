
import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, Task, Project, Report } from '@/types';
import { useDataLoading } from './app/dataLoading';
import { useTaskOperations } from './app/taskOperations';
import { useSubtaskOperations } from './app/subtaskOperations';
import { useProjectOperations } from './app/projectOperations';
import { useUserOperations } from './app/userOperations';
import { useAuthOperations } from './app/authOperations';
import { useReportOperations } from './app/reportOperations';
import { useNoteOperations } from './app/noteOperations';
import { calculateTaskProgress } from './app/utilityFunctions';
import { sortProjectsByDisplayOrder } from '@/utils/sortingUtils';

// Initial state context
type AppContextType = {
  // Users
  currentUser: User | null;
  users: User[];
  getUserById: (id: string) => User | undefined;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  
  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  updateProjectOrder: (projectId: string, direction: 'up' | 'down') => Promise<void>;
  
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'assignedDate' | 'progress'>) => Promise<Task[] | undefined>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  reassignTask: (taskId: string, newAssigneeId: string) => Promise<void>;
  getFilteredTasks: (projectId?: string, assignedTo?: string) => Task[];
  getTasksInProgress: () => Task[];
  getCompletedTasksByDate: (date: Date) => Task[];
  
  // Subtasks
  addSubtask: (taskId: string, title: string) => Promise<void>;
  updateSubtask: (subtaskId: string, updates: { status?: 'completed' | 'not-started', title?: string }) => Promise<void>;
  deleteSubtask: (subtaskId: string) => Promise<void>;
  
  // Notes
  addNote: (taskId: string, content: string) => Promise<any>;
  
  // Reports
  reports: Report[];
  addReport: (report: Omit<Report, 'id'>, taskIds: string[]) => Promise<void>;
  
  // Data loading
  loadInitialData: () => Promise<void>;
  dataLoaded: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsersList] = useState<User[]>([]);
  const [tasks, setTasksList] = useState<Task[]>([]);
  const [projects, setProjectsList] = useState<Project[]>([]);
  const [reports, setReportsList] = useState<Report[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const { loadInitialData } = useDataLoading(
    setUsersList,
    setTasksList, 
    setProjectsList,
    setReportsList,
    setDataLoaded
  );
  
  const { login, logout } = useAuthOperations(
    users, 
    setCurrentUser
  );
  
  const { getUserById } = useUserOperations(
    users
  );
  
  const { 
    getFilteredTasks, 
    getTasksInProgress,
    getCompletedTasksByDate,
    addTask, 
    updateTask, 
    deleteTask,
    reassignTask
  } = useTaskOperations(
    tasks, 
    setTasksList,
    calculateTaskProgress,
    currentUser
  );
  
  const {
    addSubtask,
    updateSubtask,
    deleteSubtask
  } = useSubtaskOperations(
    tasks,
    setTasksList
  );
  
  const {
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    updateProjectOrder
  } = useProjectOperations(
    projects,
    setProjectsList
  );
  
  const {
    addReport
  } = useReportOperations(
    reports,
    setReportsList
  );
  
  const {
    addNote
  } = useNoteOperations(
    tasks,
    setTasksList,
    currentUser
  );
  
  // Sort projects by display_order before providing them to consumers
  const sortedProjects = sortProjectsByDisplayOrder(projects);
  
  // Memoized context value to prevent unnecessary re-renders
  const contextValue = {
    currentUser,
    users,
    getUserById,
    login,
    logout,
    projects: sortedProjects,
    addProject,
    updateProject,
    deleteProject,
    updateProjectOrder,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    reassignTask,
    getFilteredTasks,
    getTasksInProgress,
    getCompletedTasksByDate,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    addNote,
    reports,
    addReport,
    loadInitialData,
    dataLoaded
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
