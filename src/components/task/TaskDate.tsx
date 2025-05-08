
import React from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { getDaysRemaining, getDueColor } from './TaskCardStyles';

interface TaskDateProps {
  dueDate?: string;
}

const TaskDate = ({ dueDate }: TaskDateProps) => {
  const formattedDate = dueDate ? format(new Date(dueDate), 'dd MMM') : 'No due date';
  const daysRemaining = getDaysRemaining(dueDate);
  const dueColor = getDueColor(daysRemaining);
  
  return (
    <div className="flex items-center text-xs text-gray-500">
      <Clock size={12} className="mr-1" />
      <span>{formattedDate}</span>
      
      {daysRemaining !== null && (
        <span className={`ml-1 ${dueColor}`}>
          ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left)
        </span>
      )}
    </div>
  );
};

export default TaskDate;
