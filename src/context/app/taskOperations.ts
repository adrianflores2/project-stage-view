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
          // Reload all tasks data to ensure we have the latest
          try {
            const { data: tasksData, error: tasksError } = await supabase
              .from('tasks')
              .select('*');
              
            if (tasksError) {
              console.error("Error reloading tasks:", tasksError);
              return;
            }
            
            // Process tasks with their details
            const tasksWithDetails = await Promise.all(
              tasksData.map(task => fetchTaskDetails(task))
            );
            
            setTasksList(tasksWithDetails.filter(Boolean) as Task[]);
            
            toast({
              title: "Tasks updated",
              description: "Task list has been refreshed with latest changes."
            });
          } catch (error) {
            console.error("Error processing realtime update:", error);
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
      new Date(task.completedDate || task.completed_date!).toDateString() === date.toDateString()
    );
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
        status: task.status,
        subtasks: [],
        notes: [],
        assignedDate: newTask.assigned_date ? new Date(newTask.assigned_date) : new Date(),
        dueDate: newTask.due_date ? new Date(newTask.due_date) : undefined,
        completedDate: newTask.completed_date ? new Date(newTask.completed_date) : undefined,
        progress: 0,
        priority: task.priority || 'Media',
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
      
      // Determine completed date based on status
      let completedDate = updatedTask.completedDate || updatedTask.completed_date;
      if (updatedTask.status === 'completed' && !completedDate) {
        completedDate = new Date();
      } else if (updatedTask.status !== 'completed') {
        completedDate = null; // Clear completed date when marking as undone
      }
      
      // Update task in Supabase
      await updateTaskInSupabase(updatedTask, progress, completedDate);
      
      // Update the task in state
      const updatedTaskWithBothProps: Task = {
        ...updatedTask,
        progress,
        // Make sure we have both camelCase and snake_case properties for compatibility
        assignedTo: updatedTask.assignedTo || updatedTask.assigned_to || '',
        projectId: updatedTask.projectId || updatedTask.project_id || '',
        completedDate: completedDate ? new Date(completedDate) : undefined,
        dueDate: updatedTask.dueDate || (updatedTask.due_date ? new Date(updatedTask.due_date) : undefined),
        assignedDate: updatedTask.assignedDate || (updatedTask.assigned_date ? new Date(updatedTask.assigned_date) : new Date()),
        // Keep the original properties
        project_id: updatedTask.projectId || updatedTask.project_id,
        assigned_to: updatedTask.assignedTo || updatedTask.assigned_to,
        due_date: updatedTask.dueDate || updatedTask.due_date,
        completed_date: completedDate,
        assigned_date: updatedTask.assignedDate || updatedTask.assigned_date
      };
      
      setTasksList(prev => 
        prev.map(task => task.id === updatedTask.id ? updatedTaskWithBothProps : task)
      );
      
      toast({
        title: "Task updated",
        description: `Task "${updatedTask.title}" has been updated.`
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
