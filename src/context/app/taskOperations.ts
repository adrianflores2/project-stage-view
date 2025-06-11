
import { Task, SubTask } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useEffect } from 'react';
import { 
  fetchTaskDetails, 
  updateTaskInSupabase, 
  deleteTaskInSupabase,
  reassignTaskInSupabase
} from './taskOperationsUtils';

export function useTaskOperations(
  tasks: Task[],
  setTasksList: React.Dispatch<React.SetStateAction<Task[]>>,
  calculateTaskProgress: (task: Task) => number,
  currentUser: any
) {
  const { toast } = useToast();
  
  // Set up realtime subscription for task updates
  useEffect(() => {
    if (!currentUser) return;
    
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', 
        {
          event: '*', 
          schema: 'public', 
          table: 'tasks'
        }, 
        async (payload) => {
          console.log('Task change detected:', payload);
          
          if (payload.eventType === 'DELETE') {
            try {
              // For DELETE, update the state by filtering out the deleted task
              const deletedTaskId = payload.old.id;
              setTasksList(prev => prev.filter(task => task.id !== deletedTaskId));
              
              toast({
                title: "Task removed",
                description: "Task has been removed from the list."
              });
            } catch (error) {
              console.error("Error processing task deletion:", error);
            }
          } else if (payload.eventType === 'INSERT') {
            // For new tasks, fetch the task details and add to the list
            try {
              const newTask = payload.new;
              const taskWithDetails = await fetchTaskDetails(newTask);
              
              if (taskWithDetails) {
                setTasksList(prev => [...prev, taskWithDetails]);
                
                toast({
                  title: "New task added",
                  description: `Task "${taskWithDetails.title}" has been added.`
                });
              }
            } catch (error) {
              console.error("Error processing new task:", error);
            }
          } else if (payload.eventType === 'UPDATE') {
            // For updated tasks, update the specific task in the list
            try {
              const updatedTask = payload.new;
              const taskWithDetails = await fetchTaskDetails(updatedTask);
              
              if (taskWithDetails) {
                setTasksList(prev => 
                  prev.map(task => task.id === taskWithDetails.id ? taskWithDetails : task)
                );
                
                toast({
                  title: "Task updated",
                  description: "Task has been updated with latest changes."
                });
              }
            } catch (error) {
              console.error("Error processing updated task:", error);
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, setTasksList, toast]);
  
  // Sort tasks by assignment date (newest first)
  const sortTasksByAssignmentDate = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      // Convert dates to timestamps for reliable comparison
      const dateA = a.assignedDate instanceof Date 
        ? a.assignedDate.getTime() 
        : new Date(a.assignedDate || a.assigned_date || 0).getTime();
      
      const dateB = b.assignedDate instanceof Date 
        ? b.assignedDate.getTime() 
        : new Date(b.assignedDate || b.assigned_date || 0).getTime();
      
      // Sort newest first (descending order)
      return dateB - dateA;
    });
  };
  
  const getFilteredTasks = (projectId?: string, assignedTo?: string) => {
    let filtered = [...tasks];
    
    if (projectId) {
      filtered = filtered.filter(task => (task.projectId || task.project_id) === projectId);
    }
    
    if (assignedTo) {
      filtered = filtered.filter(task => (task.assignedTo || task.assigned_to) === assignedTo);
    } else if (currentUser && currentUser.role === 'worker') {
      // Workers should only see tasks assigned to them
      filtered = filtered.filter(task => (task.assignedTo || task.assigned_to) === currentUser.id);
    }
    
    // Sort tasks by assignment date (newest first)
    return sortTasksByAssignmentDate(filtered);
  };

  const getTasksInProgress = () => {
    // Apply worker filtering if needed
    let filteredTasks = tasks;
    if (currentUser && currentUser.role === 'worker') {
      filteredTasks = tasks.filter(task => (task.assignedTo || task.assigned_to) === currentUser.id);
    }
    
    const inProgressTasks = filteredTasks.filter(task => 
      task.status === 'in-progress' || 
      task.subtasks.some(subtask => subtask.status === 'in-progress')
    );
    
    // Sort tasks by assignment date (newest first)
    return sortTasksByAssignmentDate(inProgressTasks);
  };
  
  const getCompletedTasksByDate = (date: Date) => {
    // Apply worker filtering if needed
    let filteredTasks = tasks;
    if (currentUser && currentUser.role === 'worker') {
      filteredTasks = tasks.filter(task => (task.assignedTo || task.assigned_to) === currentUser.id);
    }
    
    const completedTasks = filteredTasks.filter(task => 
      task.status === 'completed' && 
      (task.completedDate || task.completed_date) && 
      // Fix: Convert string date to Date object if needed
      (task.completedDate instanceof Date 
        ? task.completedDate.toDateString() === date.toDateString()
        : task.completed_date instanceof Date 
          ? task.completed_date.toDateString() === date.toDateString() 
          : new Date(task.completedDate || task.completed_date as string).toDateString() === date.toDateString())
    );
    
    // Sort tasks by assignment date (newest first)
    return sortTasksByAssignmentDate(completedTasks);
  };

  const addTask = async (task: Omit<Task, 'id' | 'assignedDate' | 'progress'>) => {
    try {
      // Check if user is worker and trying to assign to someone else
      if (currentUser?.role === 'worker') {
        const assigneeId = Array.isArray(task.assignedTo) ? task.assignedTo[0] : task.assignedTo;
        if (assigneeId !== currentUser.id) {
          throw new Error("Workers can only create tasks assigned to themselves");
        }
      }
      
      // Check if we're creating multiple tasks for different users
      const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
      
      const createdTasks: Task[] = [];
      
      for (const assignee of assignees) {
        console.log("Creating task with values:", {
          title: task.title,
          description: task.description,
          assigned_to: assignee,
          project_id: task.projectId || task.project_id,
          project_stage_id: task.project_stage_id, // This should be a UUID
          status: task.status,
          priority: task.priority,
          due_date: task.dueDate || task.due_date,
        });
      
        // Insert task in Supabase for each assignee
        const { data: newTask, error } = await supabase
          .from('tasks')
          .insert({
            title: task.title,
            description: task.description,
            assigned_to: assignee,
            project_id: task.projectId || task.project_id,
            project_stage_id: task.project_stage_id, // Make sure this is a UUID
            status: task.status,
            priority: task.priority,
            due_date: task.dueDate || task.due_date,
            progress: 0
          })
          .select()
          .single();
          
        if (error) {
          console.error("Error creating task:", error);
          throw error;
        }
        
        // Immediately update local state with the new task
        // Create a full task object with empty subtasks and notes arrays
        const fullTask: Task = {
          ...newTask,
          id: newTask.id,
          title: newTask.title,
          description: newTask.description || '',
          assignedTo: newTask.assigned_to,
          assigned_to: newTask.assigned_to,
          projectId: newTask.project_id,
          project_id: newTask.project_id,
          projectStage: task.projectStage || '',
          project_stage_id: newTask.project_stage_id,
          status: newTask.status,
          priority: newTask.priority || 'Media',
          dueDate: newTask.due_date,
          due_date: newTask.due_date,
          assignedDate: newTask.assigned_date || new Date(),
          assigned_date: newTask.assigned_date,
          completedDate: newTask.completed_date,
          completed_date: newTask.completed_date,
          progress: 0,
          subtasks: [],
          notes: []
        };
        
        createdTasks.push(fullTask);
        
        // Update state immediately
        setTasksList(prev => [...prev, fullTask]);
      }
      
      toast({
        title: "Task created",
        description: `Task "${task.title}" has been created.`
      });
      
      return createdTasks;
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive"
      });
      throw error; // Re-throw to allow the calling component to handle it
    }
  };

  const updateTask = async (updatedTask: Task) => {
    try {
      // Calculate the progress
      const progress = calculateTaskProgress(updatedTask);
      
      // Determine completed date based on status
      let completedDate = updatedTask.completedDate || updatedTask.completed_date;
      if (updatedTask.status === 'completed' && !completedDate) {
        completedDate = new Date();
      } else if (updatedTask.status !== 'completed') {
        completedDate = null; // Clear completed date when marking as undone
      }
      
      // Fix the type issues by ensuring completedDate is a Date object or null when passing to updateTaskInSupabase
      const completedDateForUpdate = completedDate instanceof Date 
        ? completedDate 
        : completedDate 
          ? new Date(completedDate) 
          : null;
      
      // Update local state immediately
      setTasksList(prev => 
        prev.map(task => {
          if (task.id === updatedTask.id) {
            return {
              ...updatedTask,
              progress: progress,
              position: updatedTask.position,
              completedDate: completedDateForUpdate,
              completed_date: completedDateForUpdate
            };
          }
          return task;
        })
      );
      
      // Update task in Supabase
      await updateTaskInSupabase(updatedTask, progress, completedDateForUpdate);
      
      toast({
        title: "Task updated",
        description: "Task has been saved successfully."
      });
      
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
      // First check if user is coordinator or admin
      if (!currentUser || (currentUser.role !== 'coordinator' && currentUser.role !== 'admin')) {
        toast({
          title: "Permission denied",
          description: "Only coordinators and admins can delete tasks",
          variant: "destructive"
        });
        return;
      }
      
      // Show a loading toast
      toast({
        title: "Deleting task...",
        description: "Removing task and related data"
      });
      
      // IMPORTANT: First complete the database operation
      const deleteSuccessful = await deleteTaskInSupabase(taskId);
      
      // Only update state after successful database operation
      if (deleteSuccessful) {
        setTasksList(prev => prev.filter(task => task.id !== taskId));
        
        // Show success toast
        toast({
          title: "Task deleted",
          description: "The task has been removed successfully"
        });
      } else {
        // This should never happen as deleteTaskInSupabase should throw an error if deletion fails
        throw new Error("Task deletion failed");
      }
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast({
        title: "Failed to delete task",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      // Don't update the UI if the database operation fails
    }
  };
  
  const reassignTask = async (taskId: string, newAssigneeId: string) => {
    try {
      // First check if user is coordinator or admin
      if (!currentUser || (currentUser.role !== 'coordinator' && currentUser.role !== 'admin')) {
        toast({
          title: "Permission denied",
          description: "Only coordinators and admins can reassign tasks",
          variant: "destructive"
        });
        return;
      }
      
      // Update local state immediately
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
      
      // Reassign task in Supabase
      await reassignTaskInSupabase(taskId, newAssigneeId);
      
      toast({
        title: "Task reassigned",
        description: "The task has been reassigned successfully"
      });
    } catch (error: any) {
      console.error("Error reassigning task:", error);
      toast({
        title: "Failed to reassign task",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  return { 
    getFilteredTasks, 
    getTasksInProgress, 
    getCompletedTasksByDate, 
    addTask, 
    updateTask, 
    deleteTask, 
    reassignTask 
  };
}
