
import React, { useState } from 'react';
import { Task } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { List, MessageSquare, User } from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { getBackgroundTint, priorityColors } from './TaskCardStyles';
import TaskBadge from './TaskBadge';
import TaskDate from './TaskDate';
import SubtasksList from './SubtasksList';
import TaskDetail from '../TaskDetail';

interface TaskListCardProps {
  task: Task;
  projectColor: string;
}

const TaskListCard = ({ task, projectColor }: TaskListCardProps) => {
  const { getUserById } = useAppContext();
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const assignedUser = getUserById(task.assignedTo);
  const canViewDetails = true; // This was previously calculated in TaskCard
  
  return (
    <>
      <div 
        className="bg-white border rounded-md p-2.5 cursor-pointer hover:bg-gray-50 transition-colors group"
        onClick={() => canViewDetails && setShowDetailDialog(true)}
        style={{ background: getBackgroundTint(projectColor) }}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-start">
              <h3 className="text-sm font-medium line-clamp-1 mr-1.5">{task.title}</h3>
              <TaskBadge status={task.status} className="px-1.5 py-0 h-5" />
              {task.priority && (
                <span className={`ml-1.5 text-xs ${priorityColors[task.priority] || ''}`}>
                  P: {task.priority}
                </span>
              )}
            </div>
            
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <User size={12} className="mr-1" />
              <span>{assignedUser?.name}</span>
              
              <div className="mx-2">|</div>
              
              <TaskDate dueDate={task.dueDate} />
              
              {task.subtasks.length > 0 && (
                <>
                  <div className="mx-2">|</div>
                  <List size={12} className="mr-1" />
                  <span>{task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center ml-2">
            {task.notes.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-xs text-gray-500 mr-2">
                    <MessageSquare size={14} />
                    <span className="ml-0.5">{task.notes.length}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.notes.length} note{task.notes.length !== 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            <div className="text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded">
              {task.progress}%
            </div>
          </div>
        </div>
        
        {/* Task completion progress */}
        <div className="w-full h-0.5 bg-gray-100 mt-2 mb-1">
          <div 
            className={`h-full ${task.status === 'completed' ? 'bg-status-completed' : 'bg-status-inProgress'}`} 
            style={{ width: `${task.progress}%` }}
          ></div>
        </div>
        
        {/* Show subtasks only on hover */}
        {task.subtasks.length > 0 && (
          <SubtasksList 
            subtasks={task.subtasks}
            className="mt-2 space-y-1 hidden group-hover:block" 
          />
        )}
      </div>
      
      {showDetailDialog && (
        <TaskDetail 
          task={task} 
          projectColor={projectColor}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
        />
      )}
    </>
  );
};

export default TaskListCard;
