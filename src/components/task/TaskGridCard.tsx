
import React, { useState } from 'react';
import { Task } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { List, MessageSquare, User } from 'lucide-react';
import { getBackgroundTint, priorityColors } from './TaskCardStyles';
import TaskBadge from './TaskBadge';
import TaskDate from './TaskDate';
import TaskProgress from './TaskProgress';
import SubtasksList from './SubtasksList';
import TaskDetail from '../TaskDetail';

interface TaskGridCardProps {
  task: Task;
  projectColor: string;
}

const TaskGridCard = ({ task, projectColor }: TaskGridCardProps) => {
  const { getUserById } = useAppContext();
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const assignedUser = getUserById(task.assignedTo);
  const canViewDetails = true; // This was previously calculated in TaskCard
  
  return (
    <>
      <Card 
        className="task-card w-full cursor-pointer group hover:shadow-md transition-shadow"
        style={{ 
          borderLeft: `4px solid ${projectColor}`,
          background: getBackgroundTint(projectColor)
        }} 
        onClick={() => canViewDetails && setShowDetailDialog(true)}
      >
        <div className="p-3 pb-1">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium line-clamp-2">{task.title}</h3>
            <div className="flex items-center space-x-1">
              {task.subtasks.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-gray-500">
                      <List size={14} className="mr-1" />
                      <span>{task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Subtasks completed</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {task.notes.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-gray-500">
                      <MessageSquare size={14} />
                      <span className="ml-1">{task.notes.length}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{task.notes.length} note{task.notes.length !== 1 ? 's' : ''}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <TaskBadge status={task.status} />
            <TaskDate dueDate={task.dueDate} />
          </div>
        </div>
        
        <div className="p-3 pt-1 pb-2">
          <TaskProgress progress={task.progress} status={task.status} className="mb-3" />
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-600 flex items-center">
              <User size={12} className="mr-1" />
              {assignedUser?.name}
              {task.priority && (
                <span className={`ml-1.5 ${priorityColors[task.priority] || ''}`}>
                  ({task.priority})
                </span>
              )}
            </div>
            <div className="text-xs font-medium">
              {task.progress}%
            </div>
          </div>
          
          {/* Show subtasks only on hover */}
          {task.subtasks.length > 0 && (
            <SubtasksList 
              subtasks={task.subtasks} 
              className="mt-2 hidden group-hover:block" 
            />
          )}
        </div>
        
        {/* Notes and additional details on hover */}
        <div className="p-0 hidden group-hover:block">
          {task.notes.length > 0 && (
            <div className="bg-gray-50 w-full p-3 text-xs text-gray-600 border-t">
              <div className="font-medium mb-1">Latest note:</div>
              <p className="line-clamp-2">{task.notes[task.notes.length - 1].content}</p>
            </div>
          )}
        </div>
      </Card>
      
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

export default TaskGridCard;
