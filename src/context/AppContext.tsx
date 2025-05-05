
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Task, Project, SubTask, Note } from '@/types';
import { users, tasks as initialTasks, projects as initialProjects, currentUser as initialCurrentUser } from '@/data/mockData';
import { useToast } from '@/components/ui/use-toast';

interface AppContextProps {
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  projects: Project[];
  setCurrentUser: (user: User) => void;
  getUserByName: (name: string) => User | undefined;
  getUserById: (id: string) => User | undefined;
  getProjectById: (id: string) => Project | undefined;
  getFilteredTasks: (projectId?: string, assignedTo?: string) => Task[];
  getTasksInProgress: () => Task[];
  addTask: (task: Omit<Task, 'id' | 'assignedDate' | 'progress'>) => void;
  updateTask: (task: Task) => void;
  addSubtask: (taskId: string, subtask: Omit<SubTask, 'id'>) => void;
  updateSubtask: (taskId: string, subtask: SubTask) => void;
  addNote: (taskId: string, content: string) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (project: Project) => void;
  calculateTaskProgress: (task: Task) => number;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(initialCurrentUser);
  const [tasksList, setTasksList] = useState<Task[]>(initialTasks);
  const [projectsList, setProjectsList] = useState<Project[]>(initialProjects);
  const { toast } = useToast();

  const getUserByName = (name: string) => {
    return users.find(user => user.name === name);
  };

  const getUserById = (id: string) => {
    return users.find(user => user.id === id);
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

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      tasks: tasksList,
      projects: projectsList,
      setCurrentUser,
      getUserByName,
      getUserById,
      getProjectById,
      getFilteredTasks,
      getTasksInProgress,
      addTask,
      updateTask,
      addSubtask,
      updateSubtask,
      addNote,
      addProject,
      updateProject,
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
