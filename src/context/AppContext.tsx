
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Task, Project, SubTask, Note } from '@/types';
import { users as initialUsers, tasks as initialTasks, projects as initialProjects } from '@/data/mockData';
import { useToast } from '@/components/ui/use-toast';

interface AppContextProps {
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  projects: Project[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setCurrentUser: (user: User) => void;
  getUserByName: (name: string) => User | undefined;
  getUserById: (id: string) => User | undefined;
  getProjectById: (id: string) => Project | undefined;
  getFilteredTasks: (projectId?: string, assignedTo?: string) => Task[];
  getTasksInProgress: () => Task[];
  getCompletedTasksByDate: (date: Date) => Task[];
  addTask: (task: Omit<Task, 'id' | 'assignedDate' | 'progress'>) => void;
  updateTask: (task: Task) => void;
  addSubtask: (taskId: string, subtask: Omit<SubTask, 'id'>) => void;
  updateSubtask: (taskId: string, subtask: SubTask) => void;
  addNote: (taskId: string, content: string) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (project: Project) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  removeUser: (userId: string) => void;
  calculateTaskProgress: (task: Task) => number;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>(initialUsers);
  const [tasksList, setTasksList] = useState<Task[]>(initialTasks);
  const [projectsList, setProjectsList] = useState<Project[]>(initialProjects);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  
  // Check for saved authentication on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse saved user:", error);
      }
    }
  }, []);

  const login = (email: string, password: string) => {
    const user = usersList.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.password === password
    );
    
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    
    return false;
  };
  
  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
  };

  const getUserByName = (name: string) => {
    return usersList.find(user => user.name === name);
  };

  const getUserById = (id: string) => {
    return usersList.find(user => user.id === id);
  };

  const getProjectById = (id: string) => {
    return projectsList.find(project => project.id === id);
  };

  const getFilteredTasks = (projectId?: string, assignedTo?: string) => {
    let filtered = [...tasksList];
    
    if (projectId) {
      filtered = filtered.filter(task => task.projectId === projectId);
    }
    
    if (assignedTo) {
      filtered = filtered.filter(task => task.assignedTo === assignedTo);
    }
    
    return filtered;
  };

  const getTasksInProgress = () => {
    return tasksList.filter(task => task.status === 'in-progress' || 
      task.subtasks.some(subtask => subtask.status === 'in-progress'));
  };
  
  const getCompletedTasksByDate = (date: Date) => {
    return tasksList.filter(task => 
      task.status === 'completed' && 
      task.completedDate && 
      new Date(task.completedDate).toDateString() === date.toDateString()
    );
  };

  const calculateTaskProgress = (task: Task) => {
    if (task.subtasks.length === 0) {
      return task.status === 'completed' ? 100 : 0;
    }
    
    const completedSubtasks = task.subtasks.filter(subtask => subtask.status === 'completed').length;
    return Math.round((completedSubtasks / task.subtasks.length) * 100);
  };

  const addTask = (task: Omit<Task, 'id' | 'assignedDate' | 'progress'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      assignedDate: new Date(),
      progress: 0,
      notes: [],
      subtasks: []
    };
    
    setTasksList(prev => [...prev, newTask]);
    toast({
      title: "Task created",
      description: `Task "${newTask.title}" has been created.`
    });
  };

  const updateTask = (updatedTask: Task) => {
    // Calculate the progress before updating
    const progress = calculateTaskProgress(updatedTask);
    
    const taskToUpdate = {
      ...updatedTask,
      progress
    };
    
    setTasksList(prev => 
      prev.map(task => task.id === updatedTask.id ? taskToUpdate : task)
    );
    
    toast({
      title: "Task updated",
      description: `Task "${updatedTask.title}" has been updated.`
    });
  };

  const addSubtask = (taskId: string, subtask: Omit<SubTask, 'id'>) => {
    const newSubtask = {
      ...subtask,
      id: `${taskId}-${Date.now()}`
    };
    
    setTasksList(prev => 
      prev.map(task => {
        if (task.id === taskId) {
          const updatedTask = {
            ...task,
            subtasks: [...task.subtasks, newSubtask]
          };
          updatedTask.progress = calculateTaskProgress(updatedTask);
          return updatedTask;
        }
        return task;
      })
    );
    
    toast({
      title: "Subtask added",
      description: "A new subtask has been added."
    });
  };

  const updateSubtask = (taskId: string, updatedSubtask: SubTask) => {
    setTasksList(prev => 
      prev.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(
            subtask => subtask.id === updatedSubtask.id ? updatedSubtask : subtask
          );
          
          const updatedTask = {
            ...task,
            subtasks: updatedSubtasks
          };
          
          updatedTask.progress = calculateTaskProgress(updatedTask);
          
          // If all subtasks are completed, mark the task as completed
          if (updatedTask.progress === 100 && !updatedTask.completedDate) {
            updatedTask.status = 'completed';
            updatedTask.completedDate = new Date();
          }
          
          return updatedTask;
        }
        return task;
      })
    );
    
    toast({
      title: "Subtask updated",
      description: "The subtask has been updated."
    });
  };

  const addNote = (taskId: string, content: string) => {
    if (!currentUser) return;
    
    const newNote: Note = {
      id: `${taskId}-note-${Date.now()}`,
      content,
      author: currentUser.name,
      createdAt: new Date()
    };
    
    setTasksList(prev => 
      prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            notes: [...task.notes, newNote]
          };
        }
        return task;
      })
    );
    
    toast({
      title: "Note added",
      description: "A new note has been added to the task."
    });
  };

  const addProject = (project: Omit<Project, 'id'>) => {
    const newProject = {
      ...project,
      id: Date.now().toString()
    };
    
    setProjectsList(prev => [...prev, newProject]);
    
    toast({
      title: "Project created",
      description: `Project "${newProject.name}" has been created.`
    });
  };

  const updateProject = (updatedProject: Project) => {
    setProjectsList(prev => 
      prev.map(project => project.id === updatedProject.id ? updatedProject : project)
    );
    
    toast({
      title: "Project updated",
      description: `Project "${updatedProject.name}" has been updated.`
    });
  };
  
  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = {
      ...user,
      id: Date.now().toString()
    };
    
    setUsersList(prev => [...prev, newUser]);
    
    toast({
      title: "User added",
      description: `User "${newUser.name}" has been successfully added.`
    });
  };
  
  const removeUser = (userId: string) => {
    // Check if user has assigned tasks
    const hasAssignedTasks = tasksList.some(task => task.assignedTo === userId);
    
    if (hasAssignedTasks) {
      toast({
        title: "Cannot remove user",
        description: "This user has assigned tasks. Please reassign them first.",
        variant: "destructive"
      });
      return;
    }
    
    setUsersList(prev => prev.filter(user => user.id !== userId));
    
    toast({
      title: "User removed",
      description: "User has been successfully removed."
    });
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users: usersList,
      tasks: tasksList,
      projects: projectsList,
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
      addSubtask,
      updateSubtask,
      addNote,
      addProject,
      updateProject,
      addUser,
      removeUser,
      calculateTaskProgress
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
