import { Task, SubTask } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useTaskOperations(
  tasks: Task[],
  setTasksList: React.Dispatch<React.SetStateAction<Task[]>>,
  calculateTaskProgress: (task: Task) => number,
  currentUser: any
) {
  const { toast } = useToast();
  
  const getFilteredTasks = (projectId?: string, assignedTo?: string) => {
    let filtered = [...tasks];
    
    if (projectId) {
      filtered = filtered.filter(task => (task.projectId || task.project_id) === projectId);
    }
    
    if (assignedTo) {
      filtered = filtered.filter(task => (task.assignedTo || task.assigned_to) === assignedTo);
    }
    
    return filtered;
  };

  const getTasksInProgress = () => {
    return tasks.filter(task => 
      task.status === 'in-progress' || 
      task.subtasks.some(subtask => subtask.status === 'in-progress')
    );
  };
  
  const getCompletedTasksByDate = (date: Date) => {
    return tasks.filter(task => 
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
