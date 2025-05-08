
import { Task, SubTask } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useSubtaskOperations(
  tasks: Task[],
  setTasksList: React.Dispatch<React.SetStateAction<Task[]>>,
  calculateTaskProgress: (task: Task) => number
) {
  const { toast } = useToast();
  
  const addSubtask = async (taskId: string, subtask: Omit<SubTask, 'id'>) => {
    try {
      // First, validate that the task exists
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        toast({
          title: "Task not found",
          description: "Cannot add subtask to non-existent task",
          variant: "destructive"
        });
        return;
      }

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
        
      if (error) {
        console.error("Error creating subtask:", error);
        throw error;
      }
      
      // Update local state immediately
      const updatedTasks = [...tasks];
      const task = updatedTasks[taskIndex];
      
      // Add the new subtask to the task
      const updatedTask = {
        ...task,
        subtasks: [...task.subtasks, newSubtask]
      };
      
      // Recalculate the progress of the task
      updatedTask.progress = calculateTaskProgress(updatedTask);
      
      // Update the task in the list
      updatedTasks[taskIndex] = updatedTask;
      setTasksList(updatedTasks);
      
      toast({
        title: "Subtask added",
        description: "New subtask has been created"
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
        .update({
          title: updatedSubtask.title,
          status: updatedSubtask.status
        })
        .eq('id', updatedSubtask.id);
        
      if (error) {
        console.error("Error updating subtask:", error);
        throw error;
      }
      
      // Update local state immediately
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          // Update the specific subtask
          const updatedSubtasks = task.subtasks.map(st => 
            st.id === updatedSubtask.id ? updatedSubtask : st
          );
          
          // Create an updated task with the new subtasks
          const updatedTask = {
            ...task,
            subtasks: updatedSubtasks
          };
          
          // Recalculate progress
          updatedTask.progress = calculateTaskProgress(updatedTask);
          
          return updatedTask;
        }
        return task;
      });
      
      setTasksList(updatedTasks);
      
      toast({
        title: "Subtask updated",
        description: "Subtask has been updated successfully"
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
  
  // Modified to not return a Promise, just perform the operation directly
  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      // Delete subtask in Supabase first
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);
          
      if (error) {
        console.error("Error deleting subtask:", error);
        throw error;
      }
        
      // Only update state after successful database operation
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          // Remove the subtask
          const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
            
          // Create an updated task with the remaining subtasks
          const updatedTask = {
            ...task,
            subtasks: updatedSubtasks
          };
            
          // Recalculate progress
          updatedTask.progress = calculateTaskProgress(updatedTask);
            
          return updatedTask;
        }
        return task;
      });
        
      // Update the state with the new task list
      setTasksList(updatedTasks);
        
      // Show success toast
      toast({
        title: "Subtask deleted",
        description: "Subtask has been removed successfully"
      });
    } catch (error: any) {
      console.error("Error deleting subtask:", error);
      toast({
        title: "Failed to delete subtask",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  return { addSubtask, updateSubtask, deleteSubtask };
}
