
import React from 'react';
import { SubTask } from '@/types';
import { getSubtaskStatusStyle } from './TaskCardStyles';

interface SubtasksListProps {
  subtasks: SubTask[];
  minimal?: boolean;
  className?: string;
}

const SubtasksList = ({ subtasks, minimal = false, className = '' }: SubtasksListProps) => {
  if (subtasks.length === 0) return null;
  
  return (
    <div className={`${className}`}>
      {!minimal && (
        <div className="text-xs font-medium text-gray-500 mb-1">Subtasks:</div>
      )}
      <div className="flex flex-wrap gap-1">
        {subtasks.map(subtask => (
          <span 
            key={subtask.id}
            className={`text-xs px-1.5 py-0.5 rounded-sm ${getSubtaskStatusStyle(subtask.status)}`}
          >
            {subtask.title}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SubtasksList;
