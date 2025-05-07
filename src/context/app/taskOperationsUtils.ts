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
  
  return true;
}

// Delete task in Supabase
export async function deleteTaskInSupabase(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
    
  if (error) throw error;
  
  return true;
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
