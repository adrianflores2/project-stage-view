
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Task, Project, SubTask, Report } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { AppContextProps } from './app/types';
import { calculateTaskProgress } from './app/utilityFunctions';
import { useProjectOperations } from './app/projectOperations';
import { useTaskOperations } from './app/taskOperations';
import { useSubtaskOperations } from './app/subtaskOperations';
import { useNoteOperations } from './app/noteOperations';
import { useUserOperations } from './app/userOperations';
import { useReportOperations } from './app/reportOperations';
import { useDataLoading } from './app/dataLoading';
import { useAuthOperations } from './app/authOperations';

// Create the AppContext with a default undefined value
const AppContext = createContext<AppContextProps | undefined>(undefined);

// Separate function to use hooks within the AppProvider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with empty arrays
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Use the custom hooks within the component body
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
    usersList
  );
  
  const { addProject, updateProject, deleteProject, getProjectById } = useProjectOperations(
    projectsList, 
    setProjectsList
  );
  
  const { getFilteredTasks, getTasksInProgress, getCompletedTasksByDate, 
          addTask, updateTask, deleteTask, reassignTask } = useTaskOperations(
    tasksList, 
    setTasksList, 
    calculateTaskProgress,
    currentUser
  );
  
  const { addSubtask, updateSubtask, deleteSubtask } = useSubtaskOperations(
    tasksList, 
    setTasksList, 
    calculateTaskProgress
  );
  
  const { addNote } = useNoteOperations(
    tasksList, 
    setTasksList, 
    currentUser
  );
  
  const { getUserByName, getUserById, addUser, removeUser } = useUserOperations(
    usersList, 
    tasksList, 
    setUsersList
  );
  
  const { generateReport, getReports } = useReportOperations(
    tasksList, 
    reportsList, 
    setReportsList, 
    currentUser
  );
  
  // Check for saved authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // Fetch user profile from our users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (!error && userData) {
          setCurrentUser(userData);
          setIsAuthenticated(true);
          await loadInitialData();
        } else {
          console.error("Error fetching user data:", error);
          logout();
        }
      }
    };
    
    checkAuth();
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser,
      users: usersList,
      tasks: tasksList,
      projects: projectsList,
      reports: reportsList,
      isAuthenticated,
      login,
      logout,
      setCurrentUser,
      getUserByName,
      getUserById,
      getProjectById,
      getFilteredTasks,
      getTasksInProgress,
      getCompletedTasksByDate,
      addTask,
      updateTask,
      deleteTask,
      deleteProject,
      reassignTask,
      addSubtask,
      updateSubtask,
      deleteSubtask,
      addNote,
      addProject,
      updateProject,
      addUser,
      removeUser,
      calculateTaskProgress,
      generateReport,
      getReports,
      loadInitialData,
      dataLoaded
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
