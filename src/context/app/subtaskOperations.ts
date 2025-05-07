
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
      const taskToUpdate = tasks.find(task => task.id === taskId);
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

  return { addSubtask, updateSubtask };
}
