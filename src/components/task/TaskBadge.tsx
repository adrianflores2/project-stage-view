
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { statusColors } from './TaskCardStyles';

interface TaskBadgeProps {
  status: string;
  className?: string;
}

const TaskBadge = ({ status, className = '' }: TaskBadgeProps) => {
  return (
    <Badge 
      variant="outline" 
      className={`text-xs px-2 ${statusColors[status as keyof typeof statusColors]} ${className}`}
    >
      {status.replace(/-/g, ' ')}
    </Badge>
  );
};

export default TaskBadge;
