import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Task, Project, SubTask, Note, Report } from '@/types';
import { users as initialUsers, tasks as initialTasks, projects as initialProjects } from '@/data/mockData';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AppContextProps {
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
  addNote: (taskId: string, content: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  calculateTaskProgress: (task: Task) => number;
  generateReport: (taskId: string, message: string) => Promise<void>;
  getReports: () => Report[];
  loadInitialData: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>(initialUsers);
  const [tasksList, setTasksList] = useState<Task[]>(initialTasks);
  const [projectsList, setProjectsList] = useState<Project[]>(initialProjects);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { toast } = useToast();
  
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

  // Load data from Supabase
  const loadInitialData = async () => {
    try {
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');
        
      if (usersError) throw usersError;
      setUsersList(usersData);
      
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
        
      if (projectsError) throw projectsError;
      
      // Load project stages for each project
      const projectsWithStages = await Promise.all(projectsData.map(async (project) => {
        const { data: stagesData, error: stagesError } = await supabase
          .from('project_stages')
          .select('*')
          .eq('project_id', project.id)
          .order('display_order', { ascending: true });
          
        if (stagesError) throw stagesError;
        
        return {
          ...project,
          stages: stagesData.map(stage => stage.name)
        };
      }));
      
      setProjectsList(projectsWithStages);
      
      // Load tasks with their subtasks and notes
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*');
        
      if (tasksError) throw tasksError;
      
      const tasksWithDetails = await Promise.all(tasksData.map(async (task) => {
        // Get subtasks
        const { data: subtasksData, error: subtasksError } = await supabase
          .from('subtasks')
          .select('*')
          .eq('task_id', task.id);
          
        if (subtasksError) throw subtasksError;
        
        // Get notes
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*, users!notes_author_id_fkey(name)')
          .eq('task_id', task.id);
          
        if (notesError) throw notesError;
        
        // Format notes with author name
        const formattedNotes = notesData.map(note => ({
          id: note.id,
          content: note.content,
          author: note.users?.name || 'Unknown',
          createdAt: note.created_at
        }));
        
        // Get project stage name
        let projectStage = "";
        if (task.project_stage_id) {
          const { data: stageData } = await supabase
            .from('project_stages')
            .select('name')
            .eq('id', task.project_stage_id)
            .single();
            
          if (stageData) {
            projectStage = stageData.name;
          }
        }
        
        const taskWithDetails: Task = {
          id: task.id,
          title: task.title,
          description: task.description || '',
          assignedTo: task.assigned_to || '',
          projectId: task.project_id || '',
          projectStage: projectStage,
          status: task.status,
          subtasks: subtasksData || [],
          notes: formattedNotes || [],
          assignedDate: task.assigned_date ? new Date(task.assigned_date) : new Date(),
          dueDate: task.due_date ? new Date(task.due_date) : undefined,
          completedDate: task.completed_date ? new Date(task.completed_date) : undefined,
          progress: task.progress || 0,
          priority: task.priority || 'Media',
          // Keep the original properties for compatibility with Supabase
          project_id: task.project_id,
          project_stage_id: task.project_stage_id,
          assigned_to: task.assigned_to,
          assigned_date: task.assigned_date,
          due_date: task.due_date,
          completed_date: task.completed_date
        };
        
        return taskWithDetails;
      }));
      
      setTasksList(tasksWithDetails);
      
      // Load reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*, users!reports_user_id_fkey(name)');
        
      if (reportsError) throw reportsError;
      
      const reportsWithDetails: Report[] = await Promise.all(reportsData.map(async (report) => {
        // Get report tasks
        const { data: reportTasksData } = await supabase
          .from('report_tasks')
          .select('tasks(*)')
          .eq('report_id', report.id);
          
        // Get report subtasks
        const { data: reportSubtasksData } = await supabase
          .from('report_subtasks')
          .select('subtasks(*)')
          .eq('report_id', report.id);
          
        // Format each task data
        const completedTasks: Task[] = reportTasksData?.map(rt => {
          const taskData = rt.tasks;
          return {
            id: taskData.id,
            title: taskData.title,
            description: taskData.description || '',
            assignedTo: taskData.assigned_to || '',
            projectId: taskData.project_id || '',
            projectStage: '',
            status: taskData.status,
            subtasks: [],
            notes: [],
            assignedDate: taskData.assigned_date ? new Date(taskData.assigned_date) : new Date(),
            progress: taskData.progress || 0,
            completedDate: taskData.completed_date ? new Date(taskData.completed_date) : undefined,
            // Keep original properties
            project_id: taskData.project_id,
            assigned_to: taskData.assigned_to
          };
        }) || [];
          
        // Format each subtask data
        const completedSubtasks: SubTask[] = reportSubtasksData?.map(rs => {
          const subtaskData = rs.subtasks;
          return {
            id: subtaskData.id,
            title: subtaskData.title,
            status: subtaskData.status
          };
        }) || [];
          
        return {
          id: report.id,
          userId: report.user_id,
          userName: report.users?.name || 'Unknown',
          date: new Date(report.date),
          message: report.message || '',
          completedTasks,
          completedSubtasks
        };
      }));
      
      setReportsList(reportsWithDetails);
      setDataLoaded(true);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Data loading error",
        description: "Failed to load data from the database. Using demo data instead.",
        variant: "destructive"
      });
      
      // Fall back to mock data
      setUsersList(initialUsers);
      setTasksList(initialTasks);
      setProjectsList(initialProjects);
      setReportsList([]);
    }
  };
  
  // Supabase login
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Fetch user from our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
          
        if (!userError && userData) {
          setCurrentUser(userData);
          setIsAuthenticated(true);
          await loadInitialData();
          return true;
        } else {
          console.error("User not found in our database", userError);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };
  
  const logout = async () => {
    await supabase.auth.signOut();
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
      filtered = filtered.filter(task => (task.projectId || task.project_id) === projectId);
    }
    
    if (assignedTo) {
      filtered = filtered.filter(task => (task.assignedTo || task.assigned_to) === assignedTo);
    }
    
    return filtered;
  };

  const getTasksInProgress = () => {
    return tasksList.filter(task => 
      task.status === 'in-progress' || 
      task.subtasks.some(subtask => subtask.status === 'in-progress')
    );
  };
  
  const getCompletedTasksByDate = (date: Date) => {
    return tasksList.filter(task => 
      task.status === 'completed' && 
      (task.completedDate || task.completed_date) && 
      new Date(task.completedDate || task.completed_date!).toDateString() === date.toDateString()
    );
  };

  const calculateTaskProgress = (task: Task) => {
    if (task.subtasks.length === 0) {
      return task.status === 'completed' ? 100 : 0;
    }
    
    const completedSubtasks = task.subtasks.filter(subtask => subtask.status === 'completed').length;
    return Math.round((completedSubtasks / task.subtasks.length) * 100);
  };

  const addTask = async (task: Omit<Task, 'id' | 'assignedDate' | 'progress'>) => {
    try {
      // Insert task in Supabase
      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          assigned_to: task.assignedTo,
          project_id: task.projectId,
          project_stage_id: task.project_stage_id,
          status: task.status,
          priority: task.priority,
          due_date: task.dueDate
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add newly created task to state with empty subtasks and notes
      const taskWithDetails: Task = {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description || '',
        assignedTo: newTask.assigned_to || '',
        projectId: newTask.project_id || '',
        projectStage: task.projectStage,
        status: newTask.status,
        subtasks: [],
        notes: [],
        assignedDate: newTask.assigned_date ? new Date(newTask.assigned_date) : new Date(),
        dueDate: newTask.due_date ? new Date(newTask.due_date) : undefined,
        completedDate: newTask.completed_date ? new Date(newTask.completed_date) : undefined,
        progress: 0,
        priority: newTask.priority || 'Media',
        // Keep original properties
        project_id: newTask.project_id,
        project_stage_id: newTask.project_stage_id,
        assigned_to: newTask.assigned_to,
        assigned_date: newTask.assigned_date,
        due_date: newTask.due_date,
        completed_date: newTask.completed_date
      };
      
      setTasksList(prev => [...prev, taskWithDetails]);
      
      toast({
        title: "Task created",
        description: `Task "${task.title}" has been created.`
      });
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateTask = async (updatedTask: Task) => {
    try {
      // Calculate the progress
      const progress = calculateTaskProgress(updatedTask);
      
      // Update task in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updatedTask.title,
          description: updatedTask.description,
          status: updatedTask.status,
          progress: progress,
          project_stage_id: updatedTask.project_stage_id,
          priority: updatedTask.priority,
          due_date: updatedTask.dueDate || updatedTask.due_date,
          completed_date: updatedTask.status === 'completed' ? new Date() : (updatedTask.completedDate || updatedTask.completed_date)
        })
        .eq('id', updatedTask.id);
        
      if (error) throw error;
      
      // Update the task in state
      const updatedTaskWithBothProps: Task = {
        ...updatedTask,
        progress,
        // Make sure we have both camelCase and snake_case properties for compatibility
        assignedTo: updatedTask.assignedTo || updatedTask.assigned_to || '',
        projectId: updatedTask.projectId || updatedTask.project_id || '',
        completedDate: updatedTask.completedDate || (updatedTask.completed_date ? new Date(updatedTask.completed_date) : undefined),
        dueDate: updatedTask.dueDate || (updatedTask.due_date ? new Date(updatedTask.due_date) : undefined),
        assignedDate: updatedTask.assignedDate || (updatedTask.assigned_date ? new Date(updatedTask.assigned_date) : new Date()),
        // Keep the original properties
        project_id: updatedTask.projectId || updatedTask.project_id,
        assigned_to: updatedTask.assignedTo || updatedTask.assigned_to,
        due_date: updatedTask.dueDate || updatedTask.due_date,
        completed_date: updatedTask.completedDate || updatedTask.completed_date,
        assigned_date: updatedTask.assignedDate || updatedTask.assigned_date
      };
      
      setTasksList(prev => 
        prev.map(task => task.id === updatedTask.id ? updatedTaskWithBothProps : task)
      );
      
      toast({
        title: "Task updated",
        description: `Task "${updatedTask.title}" has been updated.`
      });
      
      // If status changed to completed or not-completed, handle subtasks
      if (updatedTask.status !== 'completed') {
        // Delete all subtasks if status is changed
        await supabase
          .from('subtasks')
          .delete()
          .eq('task_id', updatedTask.id);
          
        setTasksList(prev => 
          prev.map(task => {
            if (task.id === updatedTask.id) {
              return {...task, subtasks: []};
            }
            return task;
          })
        );
      }
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const deleteTask = async (taskId: string) => {
    try {
      // First check if user is coordinator
      if (!currentUser || currentUser.role !== 'coordinator') {
        toast({
          title: "Permission denied",
          description: "Only coordinators can delete tasks",
          variant: "destructive"
        });
        return;
      }
      
      // Delete task in Supabase (cascade will delete subtasks and notes)
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Update local state
      setTasksList(prev => prev.filter(task => task.id !== taskId));
      
      toast({
        title: "Task deleted",
        description: "The task has been removed successfully"
      });
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const deleteProject = async (projectId: string) => {
    try {
      // First check if user is coordinator
      if (!currentUser || currentUser.role !== 'coordinator') {
        toast({
          title: "Permission denied",
          description: "Only coordinators can delete projects",
          variant: "destructive"
        });
        return;
      }
      
      // Delete project in Supabase (cascade will delete project stages and tasks)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
        
      if (error) throw error;
      
      // Update local state
      setProjectsList(prev => prev.filter(project => project.id !== projectId));
      setTasksList(prev => prev.filter(task => (task.projectId || task.project_id) !== projectId));
      
      toast({
        title: "Project deleted",
        description: "The project has been removed successfully"
      });
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast({
        title: "Failed to delete project",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const reassignTask = async (taskId: string, newAssigneeId: string) => {
    try {
      // First check if user is coordinator
      if (!currentUser || currentUser.role !== 'coordinator') {
        toast({
          title: "Permission denied",
          description: "Only coordinators can reassign tasks",
          variant: "destructive"
        });
        return;
      }
      
      // Update task in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({ assigned_to: newAssigneeId })
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Update local state
      setTasksList(prev => 
        prev.map(task => {
          if (task.id === taskId) {
            return {
              ...task, 
              assignedTo: newAssigneeId,
              assigned_to: newAssigneeId
            };
          }
          return task;
        })
      );
      
      toast({
        title: "Task reassigned",
        description: "The task has been reassigned successfully"
      });
    } catch (error: any) {
      console.error("Error reassigning task:", error);
      toast({
        title: "Failed to reassign task",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addSubtask = async (taskId: string, subtask: Omit<SubTask, 'id'>) => {
    try {
      // Insert subtask in Supabase
      const { data: newSubtask, error } = await supabase
        .from('subtasks')
        .insert({
          task_id: taskId,
          title: subtask.title,
          status: subtask.status
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update task progress
      const taskToUpdate = tasksList.find(task => task.id === taskId);
      if (taskToUpdate) {
        const updatedTask = {
          ...taskToUpdate,
          subtasks: [...taskToUpdate.subtasks, newSubtask]
        };
        
        const progress = calculateTaskProgress(updatedTask);
        
        // Update progress in database
        await supabase
          .from('tasks')
          .update({ progress })
          .eq('id', taskId);
        
        setTasksList(prev => 
          prev.map(task => {
            if (task.id === taskId) {
              return {
                ...task,
                subtasks: [...task.subtasks, newSubtask],
                progress
              };
            }
            return task;
          })
        );
      }
      
      toast({
        title: "Subtask added",
        description: "A new subtask has been added."
      });
    } catch (error: any) {
      console.error("Error adding subtask:", error);
      toast({
        title: "Failed to add subtask",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateSubtask = async (taskId: string, updatedSubtask: SubTask) => {
    try {
      // Update subtask in Supabase
      const { error } = await supabase
        .from('subtasks')
        .update({ status: updatedSubtask.status })
        .eq('id', updatedSubtask.id);
        
      if (error) throw error;
      
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
            
            const progress = calculateTaskProgress(updatedTask);
            
            // Check if all subtasks are completed
            const allCompleted = updatedSubtasks.every(st => st.status === 'completed');
            
            // Update task status and completed date if all subtasks are completed
            if (allCompleted && !(task.completedDate || task.completed_date)) {
              const completedDate = new Date();
              supabase
                .from('tasks')
                .update({
                  status: 'completed',
                  completed_date: completedDate,
                  progress: 100
                })
                .eq('id', taskId)
                .then();
              
              return {
                ...updatedTask,
                status: 'completed',
                completedDate: completedDate,
                completed_date: completedDate,
                progress: 100
              };
            } else {
              // Just update progress
              supabase
                .from('tasks')
                .update({ progress })
                .eq('id', taskId)
                .then();
                
              return {
                ...updatedTask,
                progress
              };
            }
          }
          return task;
        })
      );
      
      toast({
        title: "Subtask updated",
        description: "The subtask has been updated."
      });
    } catch (error: any) {
      console.error("Error updating subtask:", error);
      toast({
        title: "Failed to update subtask",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addNote = async (taskId: string, content: string) => {
    if (!currentUser) return;
    
    try {
      // Insert note in Supabase
      const { data: newNote, error } = await supabase
        .from('notes')
        .insert({
          task_id: taskId,
          content: content,
          author_id: currentUser.id
        })
        .select('*, users!notes_author_id_fkey(name)')
        .single();
        
      if (error) throw error;
      
      const formattedNote = {
        id: newNote.id,
        content: newNote.content,
        author: newNote.users?.name || currentUser.name,
        createdAt: newNote.created_at
      };
      
      setTasksList(prev => 
        prev.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              notes: [...task.notes, formattedNote]
            };
          }
          return task;
        })
      );
      
      toast({
        title: "Note added",
        description: "A new note has been added to the task."
      });
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addProject = async (project: Omit<Project, 'id'>) => {
    try {
      // Insert project in Supabase
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name: project.name,
          color: project.color
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add stages for the project
      if (project.stages && project.stages.length > 0) {
        const stagesToInsert = project.stages.map((stage, index) => ({
          project_id: newProject.id,
          name: stage,
          display_order: index
        }));
        
        const { error: stagesError } = await supabase
          .from('project_stages')
          .insert(stagesToInsert);
          
        if (stagesError) throw stagesError;
      }
      
      // Add to state with stages
      const projectWithStages = {
        ...newProject,
        stages: project.stages || []
      };
      
      setProjectsList(prev => [...prev, projectWithStages]);
      
      toast({
        title: "Project created",
        description: `Project "${project.name}" has been created.`
      });
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast({
        title: "Failed to create project",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateProject = async (updatedProject: Project) => {
    try {
      // Update project in Supabase
      const { error } = await supabase
        .from('projects')
        .update({
          name: updatedProject.name,
          color: updatedProject.color
        })
        .eq('id', updatedProject.id);
        
      if (error) throw error;
      
      // Update stages if changed
      if (updatedProject.stages) {
        // First delete existing stages
        await supabase
          .from('project_stages')
          .delete()
          .eq('project_id', updatedProject.id);
          
        // Add new stages
        const stagesToInsert = updatedProject.stages.map((stage, index) => ({
          project_id: updatedProject.id,
          name: stage,
          display_order: index
        }));
        
        if (stagesToInsert.length > 0) {
          const { error: stagesError } = await supabase
            .from('project_stages')
            .insert(stagesToInsert);
            
          if (stagesError) throw stagesError;
        }
      }
      
      setProjectsList(prev => 
        prev.map(project => project.id === updatedProject.id ? updatedProject : project)
      );
      
      toast({
        title: "Project updated",
        description: `Project "${updatedProject.name}" has been updated.`
      });
    } catch (error: any) {
      console.error("Error updating project:", error);
      toast({
        title: "Failed to update project",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const addUser = async (user: Omit<User, 'id'>) => {
    try {
      // Insert user in Supabase
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          name: user.name,
          email: user.email,
          role: user.role
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setUsersList(prev => [...prev, newUser]);
      
      toast({
        title: "User added",
        description: `User "${newUser.name}" has been successfully added.`
      });
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast({
        title: "Failed to add user",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const removeUser = async (userId: string) => {
    try {
      // Check if user has assigned tasks
      const userTasks = tasksList.filter(task => (task.assignedTo || task.assigned_to) === userId);
      
      if (userTasks.length > 0) {
        toast({
          title: "Cannot remove user",
          description: "This user has assigned tasks. Please reassign them first.",
          variant: "destructive"
        });
        return;
      }
      
      // Delete user from Supabase
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsersList(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "User removed",
        description: "User has been successfully removed."
      });
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast({
        title: "Failed to remove user",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  // Generate worker report
  const generateReport = async (taskId: string, message: string) => {
    if (!currentUser) return;
    
    try {
      // Create report in Supabase
      const { data: newReport, error } = await supabase
        .from('reports')
        .insert({
          user_id: currentUser.id,
          message: message,
          date: new Date()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Get all completed tasks and subtasks for the current user from today
      const today = new Date();
      const todaysCompletedTasks = tasksList.filter(t => 
        (t.assignedTo || t.assigned_to) === currentUser.id &&
        t.status === 'completed' &&
        (t.completedDate || t.completed_date) &&
        new Date((t.completedDate || t.completed_date)!).toDateString() === today.toDateString()
      );
      
      // Add tasks to report_tasks
      if (todaysCompletedTasks.length > 0) {
        const taskLinks = todaysCompletedTasks.map(task => ({
          report_id: newReport.id,
          task_id: task.id
        }));
        
        await supabase
          .from('report_tasks')
          .insert(taskLinks);
      }
      
      // Get all subtasks completed today
      const completedSubtasks: SubTask[] = [];
      tasksList
        .filter(t => (t.assignedTo || t.assigned_to) === currentUser.id)
        .forEach(t => {
          const completed = t.subtasks.filter(st => st.status === 'completed');
          completedSubtasks.push(...completed);
        });
      
      // Add subtasks to report_subtasks
      if (completedSubtasks.length > 0) {
        const subtaskLinks = completedSubtasks.map(subtask => ({
          report_id: newReport.id,
          subtask_id: subtask.id
        }));
        
        await supabase
          .from('report_subtasks')
          .insert(subtaskLinks);
      }
      
      // Format report for state
      const formattedReport: Report = {
        id: newReport.id,
        userId: currentUser.id,
        userName: currentUser.name,
        date: newReport.date,
        message: newReport.message,
        completedTasks: todaysCompletedTasks,
        completedSubtasks: completedSubtasks
      };
      
      setReportsList(prev => [...prev, formattedReport]);
      
      toast({
        title: "Report generated",
        description: "Your daily report has been submitted successfully."
      });
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Failed to generate report",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  // Get all reports
  const getReports = () => {
    if (currentUser?.role === 'worker') {
      // Workers can only see their own reports
      return reportsList.filter(report => report.userId === currentUser.id);
    }
    // Coordinators and Supervisors can see all reports
    return reportsList;
  };

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
      addNote,
      addProject,
      updateProject,
      addUser,
      removeUser,
      calculateTaskProgress,
      generateReport,
      getReports,
      loadInitialData
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
