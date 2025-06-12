import { supabase } from '@/integrations/supabase/client';
import { processTasksResponse } from '@/context/app/dataLoadingUtils';
import { Task } from '@/types';

export async function fetchUserTasks(userId?: string | null): Promise<Task[]> {
  const query = supabase.from('tasks').select('*');
  if (userId) {
    query.eq('assigned_to', userId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return processTasksResponse(data || []);
}

