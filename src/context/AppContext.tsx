
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Task, Project, SubTask, Report } from '@/types';
import { Provider, Quotation, QuotationItem } from '@/types/quotation';
import { supabase } from '@/integrations/supabase/client';
import { AppContextProps } from './app/types';
import { calculateTaskProgress } from './app/utilityFunctions';
import { useProjectOperations } from './app/projectOperations';
import { useTaskOperations } from './app/taskOperations';
import { useSubtaskOperations } from './app/subtaskOperations';
import { useNoteOperations } from './app/noteOperations';
import { useUserOperations } from './app/userOperations';
import { useReportOperations } from './app/reportOperations';
import { useQuotationOperations } from './app/quotationOperations';
import { useDataLoading } from './app/dataLoading';
import { useAuthOperations } from './app/authOperations';

// Create the AppContext with a default undefined value
const AppContext = createContext<AppContextProps | undefined>(undefined);

// AppProvider component that provides the context values
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with empty arrays
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [providersList, setProvidersList] = useState<Provider[]>([]);
  const [quotationsList, setQuotationsList] = useState<Quotation[]>([]);
  const [quotationItemsList, setQuotationItemsList] = useState<QuotationItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Use the custom hooks within the component body
  const { loadInitialData } = useDataLoading(
    setUsersList, 
    setTasksList, 
    setProjectsList, 
    setReportsList,
    setProvidersList,
    setQuotationsList,
    setQuotationItemsList,
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
  
  const { getQuotationsByProjectId, getQuotationItemsByQuotationId, getProviders,
          addQuotation, updateQuotation, deleteQuotation,
          addQuotationItem, updateQuotationItem, deleteQuotationItem,
          generateQuotationTasks } = useQuotationOperations(
    providersList,
    quotationsList,
    quotationItemsList,
    setQuotationsList,
    setQuotationItemsList,
    addTask,
    addSubtask,
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

  // Connect quotations to their projects and items
  useEffect(() => {
    if (dataLoaded) {
      // Connect quotations to projects
      setQuotationsList(prevQuotations => 
        prevQuotations.map(quotation => ({
          ...quotation,
          project: projectsList.find(p => p.id === quotation.project_id),
          requester: usersList.find(u => u.id === quotation.requested_by),
          items: quotationItemsList.filter(item => item.quotation_id === quotation.id)
        }))
      );
      
      // Connect quotation items to responsible users
      setQuotationItemsList(prevItems => 
        prevItems.map(item => ({
          ...item,
          responsible: usersList.find(u => u.id === item.ficha_responsable)
        }))
      );
    }
  }, [dataLoaded, projectsList, usersList, quotationsList, quotationItemsList]);

  return (
    <AppContext.Provider value={{
      currentUser,
      users: usersList,
      tasks: tasksList,
      projects: projectsList,
      reports: reportsList,
      providers: providersList,
      quotations: quotationsList,
      quotationItems: quotationItemsList,
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
      getQuotationsByProjectId,
      getQuotationItemsByQuotationId,
      getProviders,
      addQuotation,
      updateQuotation,
      deleteQuotation,
      addQuotationItem,
      updateQuotationItem,
      deleteQuotationItem,
      generateQuotationTasks,
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
