import { Task, SubTask } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useEffect } from 'react';

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
          // Reload all tasks data to ensure we have the latest
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*');
            
          if (tasksError) {
            console.error("Error reloading tasks:", tasksError);
            return;
          }
          
          // Process tasks with their subtasks and notes
          const tasksWithDetails = await Promise.all(tasksData.map(async (task) => {
            // Get subtasks
            const { data: subtasksData } = await supabase
              .from('subtasks')
              .select('*')
              .eq('task_id', task.id);
              
            // Get notes
            const { data: notesData } = await supabase
              .from('notes')
              .select('*, users!notes_author_id_fkey(name)')
              .eq('task_id', task.id);
              
            // Format notes with author name
            const formattedNotes = notesData?.map(note => ({
              id: note.id,
              content: note.content,
              author: note.users?.name || 'Unknown',
              createdAt: note.created_at
            })) || [];
            
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
          
          toast({
            title: "Tasks updated",
            description: "Task list has been refreshed with latest changes."
          });
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
          completed_date: completedDate
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
