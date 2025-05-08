
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { TaskStatus } from '@/types';

interface TaskProgressProps {
  progress: number;
  status: TaskStatus;
  showLabel?: boolean;
  className?: string;
}

const TaskProgress = ({ progress, status, showLabel = true, className = '' }: TaskProgressProps) => {
  return (
    <div className={`${className}`}>
      <Progress 
        value={progress} 
        className="h-1"
        indicatorClassName={status === 'completed' ? 'bg-status-completed' : 'bg-status-inProgress'}
      />
      {showLabel && (
        <div className="flex justify-end mt-1">
          <div className="text-xs font-medium">
            {progress}%
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskProgress;
