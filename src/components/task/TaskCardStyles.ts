
import { Task } from '@/types';

// Status colors mapping
export const statusColors = {
  'not-started': 'bg-status-notStarted',
  'in-progress': 'bg-status-inProgress',
  'paused': 'bg-status-paused',
  'completed': 'bg-status-completed'
};

// Priority colors mapping
export const priorityColors: Record<string, string> = {
  'Alta': 'text-red-600',
  'Media': 'text-yellow-600',
  'Baja': 'text-blue-600'
};

// Get background tint color for project
export const getBackgroundTint = (projectColor: string) => {
  // Convert hex to RGB with opacity
  const hex = projectColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.1)`;
};

// Get style for subtask status
export const getSubtaskStatusStyle = (status: string) => {
  switch (status) {
    case 'not-started': return 'bg-gray-200 text-gray-700';
    case 'in-progress': return 'bg-blue-100 text-blue-700';
    case 'completed': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// Calculate days remaining until due date
export const getDaysRemaining = (dueDate?: string | Date) => {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get color for due date countdown
export const getDueColor = (daysRemaining: number | null) => {
  if (daysRemaining === null) return 'text-gray-500';
  if (daysRemaining <= 0) return 'text-red-500 font-medium';
  if (daysRemaining <= 2) return 'text-yellow-600 font-medium';
  return 'text-green-600 font-medium';
};

// Get task border style based on status
export const getTaskBorderStyle = (status: string) => {
  switch (status) {
    case 'in-progress': return 'border-2 border-blue-400';
    default: return 'border border-gray-200';
  }
};

// Format days left message
export const formatDaysLeft = (daysRemaining: number | null) => {
  if (daysRemaining === null) return '';
  if (daysRemaining === 0) return 'Due today';
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'day' : 'days'} overdue`;
  return `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`;
};
