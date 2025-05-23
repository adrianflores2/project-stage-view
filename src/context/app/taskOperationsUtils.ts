
import { Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Fetch task details (subtasks and notes)
export async function fetchTaskDetails(task: any): Promise<Task | null> {
  if (!task) return null;
  
  try {
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
  } catch (error) {
    console.error("Error fetching task details:", error);
    return null;
  }
}

// Update task in Supabase
export async function updateTaskInSupabase(
  updatedTask: Task, 
  progress: number, 
  completedDate: Date | null
) {
  console.log("Updating task in Supabase:", {
    id: updatedTask.id,
    title: updatedTask.title,
    description: updatedTask.description,
    status: updatedTask.status,
    progress: progress,
    project_stage_id: updatedTask.project_stage_id,
    priority: updatedTask.priority,
    due_date: updatedTask.dueDate || updatedTask.due_date,
    completed_date: completedDate
  });

  const { data, error } = await supabase
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
    
  if (error) {
    console.error("Error updating task in Supabase:", error);
    throw error;
  }
  
  console.log("Task updated successfully:", data);
  return true;
}

// Improved task deletion in Supabase with proper synchronous pattern
export async function deleteTaskInSupabase(taskId: string): Promise<boolean> {
  try {
    console.log("Starting to delete task with ID:", taskId);
    
    // First, fetch all subtask IDs associated with this task
    const { data: subtaskIds, error: subtaskFetchError } = await supabase
      .from('subtasks')
      .select('id')
      .eq('task_id', taskId);
      
    if (subtaskFetchError) {
      console.error("Error fetching subtask IDs:", subtaskFetchError);
      throw subtaskFetchError;
    }
    
    // Delete all subtasks associated with the task
    const { error: subtasksError } = await supabase
      .from('subtasks')
      .delete()
      .eq('task_id', taskId);
    
    if (subtasksError) {
      console.error("Error deleting subtasks:", subtasksError);
      throw subtasksError;
    }
    console.log("Subtasks deleted successfully");
    
    // Delete all notes associated with the task
    const { error: notesError } = await supabase
      .from('notes')
      .delete()
      .eq('task_id', taskId);
    
    if (notesError) {
      console.error("Error deleting notes:", notesError);
      throw notesError;
    }
    console.log("Notes deleted successfully");
    
    // Delete any report tasks relationships
    const { error: reportTasksError } = await supabase
      .from('report_tasks')
      .delete()
      .eq('task_id', taskId);
    
    // Ignore "no rows returned" error (PGRST116)
    if (reportTasksError && reportTasksError.code !== 'PGRST116') {
      console.error("Error deleting report tasks relationships:", reportTasksError);
      throw reportTasksError;
    }
    console.log("Report task relationships deleted successfully");
    
    // If we have subtask IDs, clean up any report subtasks relationships
    if (subtaskIds && subtaskIds.length > 0) {
      // Extract just the ID values into a simple array
      const subtaskIdArray = subtaskIds.map(item => item.id);
      
      // Delete report_subtasks entries for these subtask IDs
      const { error: reportSubtasksError } = await supabase
        .from('report_subtasks')
        .delete()
        .in('subtask_id', subtaskIdArray);
      
      // Ignore "no rows returned" error (PGRST116)
      if (reportSubtasksError && reportSubtasksError.code !== 'PGRST116') {
        console.error("Error deleting report subtasks relationships:", reportSubtasksError);
        throw reportSubtasksError;
      }
      console.log("Report subtask relationships deleted successfully");
    } else {
      console.log("No subtasks to clean up relationships for");
    }
    
    // Finally delete the task itself
    const { error: taskError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
      
    if (taskError) {
      console.error("Error deleting task:", taskError);
      throw taskError;
    }
    
    console.log("Task deleted successfully");
    return true;
  } catch (error) {
    console.error("Error in deleteTaskInSupabase:", error);
    throw error; // Re-throw to allow proper error handling in the calling function
  }
}

// Reassign task in Supabase
export async function reassignTaskInSupabase(taskId: string, newAssigneeId: string) {
  const { error } = await supabase
    .from('tasks')
    .update({ assigned_to: newAssigneeId })
    .eq('id', taskId);
    
  if (error) throw error;
  
  return true;
}
