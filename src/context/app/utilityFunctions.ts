
import { Task } from '@/types';

export function calculateTaskProgress(task: Task): number {
  if (task.subtasks.length === 0) {
    return task.status === 'completed' ? 100 : 0;
  }
  
  const completedSubtasks = task.subtasks.filter(subtask => subtask.status === 'completed').length;
  return Math.round((completedSubtasks / task.subtasks.length) * 100);
}
