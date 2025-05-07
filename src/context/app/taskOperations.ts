
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
    
    return filtered;
  };

  const getTasksInProgress = () => {
    // Apply worker filtering if needed
    let filteredTasks = tasks;
    if (currentUser && currentUser.role === 'worker') {
      filteredTasks = tasks.filter(task => (task.assignedTo || task.assigned_to) === currentUser.id);
    }
    
    return filteredTasks.filter(task => 
      task.status === 'in-progress' || 
      task.subtasks.some(subtask => subtask.status === 'in-progress')
    );
  };
  
  const getCompletedTasksByDate = (date: Date) => {
    // Apply worker filtering if needed
    let filteredTasks = tasks;
    if (currentUser && currentUser.role === 'worker') {
      filteredTasks = tasks.filter(task => (task.assignedTo || task.assigned_to) === currentUser.id);
    }
    
    return filteredTasks.filter(task => 
      task.status === 'completed' && 
      (task.completedDate || task.completed_date) && 
      // Fix: Convert string date to Date object if needed
      (task.completedDate instanceof Date 
        ? task.completedDate.toDateString() === date.toDateString()
        : task.completed_date instanceof Date 
          ? task.completed_date.toDateString() === date.toDateString() 
          : new Date(task.completedDate || task.completed_date as string).toDateString() === date.toDateString())
    );
  };

  const addTask = async (task: Omit<Task, 'id' | 'assignedDate' | 'progress'>) => {
    try {
      // Check if we're creating multiple tasks for different users
      const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
      
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
        
        // We don't need to manually update the state here
        // The realtime subscription will handle adding the task to state
      }
      
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
      
      // Update task in Supabase
      await updateTaskInSupabase(updatedTask, progress, completedDateForUpdate);
      
      // We don't need to manually update the state here
      // The realtime subscription will handle updating the task in state
      
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
      // First check if user is coordinator
      if (!currentUser || currentUser.role !== 'coordinator') {
        toast({
          title: "Permission denied",
          description: "Only coordinators can delete tasks",
          variant: "destructive"
        });
        return;
      }
      
      // Delete task in Supabase
      await deleteTaskInSupabase(taskId);
      
      // Update local state - this gives immediate visual feedback
      // The realtime subscription will also handle this
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
      
      // Reassign task in Supabase
      await reassignTaskInSupabase(taskId, newAssigneeId);
      
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
