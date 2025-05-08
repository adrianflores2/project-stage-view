
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
      console.log("Adding subtask for task ID:", taskId);
      
      // Verify that the task exists first
      const taskExists = tasks.some(task => task.id === taskId);
      
      if (!taskExists) {
        throw new Error(`Task with ID ${taskId} not found`);
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
        console.error("Supabase error adding subtask:", error);
        throw error;
      }
      
      if (!newSubtask) {
        throw new Error("Failed to create subtask - no data returned");
      }
      
      console.log("Subtask created successfully:", newSubtask);
      
      // Update task progress
      const taskToUpdate = tasks.find(task => task.id === taskId);
      if (taskToUpdate) {
        const updatedTask = {
          ...taskToUpdate,
          subtasks: [...taskToUpdate.subtasks, newSubtask]
        };
        
        const progress = calculateTaskProgress(updatedTask);
        console.log("Updating task progress to:", progress);
        
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
      
      return newSubtask;
    } catch (error: any) {
      console.error("Error adding subtask:", error);
      toast({
        title: "Failed to add subtask",
        description: error.message,
        variant: "destructive"
      });
      throw error;
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

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      console.log("Deleting subtask:", subtaskId, "from task:", taskId);
      
      // Delete subtask in Supabase
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);
        
      if (error) {
        console.error("Supabase error deleting subtask:", error);
        throw error;
      }
      
      // Update local state
      setTasksList(prev => 
        prev.map(task => {
          if (task.id === taskId) {
            // Remove the subtask from the array
            const updatedSubtasks = task.subtasks.filter(
              subtask => subtask.id !== subtaskId
            );
            
            const updatedTask = {
              ...task,
              subtasks: updatedSubtasks
            };
            
            // Recalculate progress
            const progress = calculateTaskProgress(updatedTask);
            
            // Update progress in database
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
          return task;
        })
      );
      
      toast({
        title: "Subtask deleted",
        description: "The subtask has been removed."
      });
    } catch (error: any) {
      console.error("Error deleting subtask:", error);
      toast({
        title: "Failed to delete subtask",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return { addSubtask, updateSubtask, deleteSubtask };
}
