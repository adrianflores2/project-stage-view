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
import { AppContextProps } from './app/types';

// Create the context
const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsersList] = useState<User[]>([]);
  const [tasks, setTasksList] = useState<Task[]>([]);
  const [projects, setProjectsList] = useState<Project[]>([]);
  const [reports, setReportsList] = useState<Report[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { loadInitialData } = useDataLoading(
    setUsersList,
    setTasksList, 
    setProjectsList,
    setReportsList,
    setDataLoaded
  );
  
  const { login, logout } = useAuthOperations(
    setCurrentUser,
    setIsAuthenticated,
    loadInitialData,
    users
  );
  
  const { getUserById, getUserByName, addUser, removeUser } = useUserOperations(
    users,
    tasks,
    setUsersList
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
    addReport,
    generateReport,
    getReports
  } = useReportOperations(
    reports,
    setReportsList,
    currentUser
  );
  
  const {
    addNote
  } = useNoteOperations(
    tasks,
    setTasksList,
    currentUser
  );
  
  const sortedProjects = sortProjectsByDisplayOrder(projects);
  
  const contextValue: AppContextProps = {
    currentUser,
    users,
    getUserById,
    getUserByName,
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
    generateReport,
    getReports,
    loadInitialData,
    dataLoaded,
    isAuthenticated,
    getProjectById,
    setCurrentUser,
    calculateTaskProgress,
    addUser,
    removeUser
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
