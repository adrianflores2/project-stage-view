
import { Task, Project } from '@/types';

// Sort tasks by assignment date, newest first
export const sortTasksByAssignmentDate = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    const dateA = a.assignedDate instanceof Date 
      ? a.assignedDate 
      : new Date(a.assignedDate || a.assigned_date || 0);
    
    const dateB = b.assignedDate instanceof Date 
      ? b.assignedDate 
      : new Date(b.assignedDate || b.assigned_date || 0);
    
    return dateB.getTime() - dateA.getTime(); // Newest first
  });
};

// Sort projects by display order
export const sortProjectsByDisplayOrder = (projects: Project[]): Project[] => {
  return [...projects].sort((a, b) => {
    return (a.display_order || 0) - (b.display_order || 0);
  });
};
