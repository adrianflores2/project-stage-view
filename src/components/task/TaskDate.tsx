
import React from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { getDaysRemaining, getDueColor, formatDaysLeft } from './TaskCardStyles';

interface TaskDateProps {
  dueDate?: string | Date;
  showDaysLeft?: boolean;
}

const TaskDate = ({ dueDate, showDaysLeft = false }: TaskDateProps) => {
  // Convert to string format if it's a Date object
  const dueDateString = dueDate ? (dueDate instanceof Date ? dueDate.toISOString() : dueDate) : undefined;
  
  // Format date without time
  const formattedDate = dueDateString 
    ? format(new Date(dueDateString), 'dd MMM') 
    : 'No due date';
    
  const daysRemaining = getDaysRemaining(dueDateString);
  const dueColor = getDueColor(daysRemaining);
  
  if (showDaysLeft && daysRemaining !== null) {
    return (
      <div className={`flex items-center text-xs ${dueColor}`}>
        <Clock size={12} className="mr-1" />
        <span>{formatDaysLeft(daysRemaining)}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center text-xs text-gray-500">
      <Clock size={12} className="mr-1" />
      <span>{formattedDate}</span>
    </div>
  );
};

export default TaskDate;
