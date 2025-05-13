
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Project, Task } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to get a sort value, handling both old display_order and new sort_order fields
export function getProjectSortOrder(project: Project): number {
  return project.sort_order !== undefined ? project.sort_order : (project.display_order || 0);
}

// Utility to sort projects by order
export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => getProjectSortOrder(a) - getProjectSortOrder(b));
}

// Utility function to sort tasks by assignment date (newest first)
export function sortTasksByAssignmentDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const dateA = new Date(a.assignedDate || a.assigned_date || '').getTime();
    const dateB = new Date(b.assignedDate || b.assigned_date || '').getTime();
    return dateB - dateA; // Sort descending (newest first)
  });
}
