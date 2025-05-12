
import React, { useState } from 'react';
import { Task } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock, List, MessageSquare, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { 
  getBackgroundTint, 
  priorityColors, 
  getDaysRemaining, 
  getDueColor,
  getTaskBorderStyle,
  formatDaysLeft
} from './TaskCardStyles';
import TaskBadge from './TaskBadge';
import TaskProgress from './TaskProgress';
import TaskDate from './TaskDate';
import SubtasksList from './SubtasksList';
import TaskDetail from '../TaskDetail';

interface TaskGridCardProps {
  task: Task;
  projectColor: string;
  showMinimalInfo?: boolean;
}

const TaskGridCard = ({ task, projectColor, showMinimalInfo = false }: TaskGridCardProps) => {
  const { getUserById } = useAppContext();
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const assignedUser = getUserById(task.assignedTo || task.assigned_to || '');
  const daysRemaining = getDaysRemaining(task.dueDate || task.due_date);
  const dueColor = getDueColor(daysRemaining);
  
  // Handler to open details
  const handleOpenDetails = () => {
    setShowDetailDialog(true);
  };
  
  // For completed tasks with minimal info
  if (showMinimalInfo && task.status === 'completed') {
    return (
      <>
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleOpenDetails}
          style={{ background: getBackgroundTint(projectColor) }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CardHeader className="p-2 pb-1">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium line-clamp-1">{task.title}</h3>
            </div>
          </CardHeader>
          
          <CardContent className="p-2 space-y-1">
            {/* Project Stage */}
            <div className="text-xs text-gray-500">
              <span className="font-medium">Stage:</span> {task.projectStage}
            </div>
            
            {/* Assignee */}
            {assignedUser && (
              <div className="text-xs text-gray-500 flex items-center">
                <User size={12} className="mr-1" />
                <span>{assignedUser.name}</span>
              </div>
            )}
            
            {/* Completed Date */}
            {(task.completedDate || task.completed_date) && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">Completed:</span> {format(
                  new Date(task.completedDate || task.completed_date!), 
                  'MMM d, yyyy'
                )}
              </div>
            )}
            
            {/* Subtasks counter */}
            {task.subtasks.length > 0 && (
              <div className="text-xs flex items-center gap-1">
                <List size={12} className="mr-1 text-gray-500" />
                <span className="text-gray-500">{task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length}</span>
              </div>
            )}
            
            {/* Subtasks - visible on hover */}
            {isHovered && task.subtasks.length > 0 && (
              <SubtasksList subtasks={task.subtasks} className="mt-1" />
            )}
            
            {/* Latest note - visible on hover */}
            {isHovered && task.notes.length > 0 && (
              <div className="mt-2 text-xs border-t border-gray-200 pt-1">
                <div className="font-medium text-gray-500">Latest note:</div>
                <div className="text-gray-600 mt-0.5 line-clamp-2">{task.notes[0].content}</div>
              </div>
            )}
          </CardContent>
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
  }
  
  // Regular card display
  return (
    <>
      <Card 
        className={`cursor-pointer hover:shadow-md transition-shadow ${getTaskBorderStyle(task.status)}`}
        onClick={handleOpenDetails}
        style={{ background: getBackgroundTint(projectColor) }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="p-2 pb-1">
          <div className="flex justify-between items-start gap-1">
            <h3 className="text-sm font-medium line-clamp-1">{task.title}</h3>
            <TaskBadge status={task.status} className="py-0 h-4" />
          </div>
        </CardHeader>
        
        <CardContent className="p-2 space-y-1.5">
          {/* Assignee and priority */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center">
              <User size={12} className="mr-1 text-gray-500" />
              <span className="text-gray-500">{assignedUser?.name}</span>
            </div>
            
            {task.priority && (
              <span className={`${priorityColors[task.priority] || ''}`}>
                P: {task.priority}
              </span>
            )}
          </div>
          
          {/* Days remaining for in-progress tasks */}
          {task.status === 'in-progress' && daysRemaining !== null && (
            <div className={`flex items-center text-xs ${dueColor}`}>
              <Clock size={12} className="mr-1" />
              <span>{formatDaysLeft(daysRemaining)}</span>
            </div>
          )}
          
          {/* Progress bar */}
          <TaskProgress progress={task.progress} status={task.status} />
          
          {/* Task metadata */}
          <div className="flex justify-between items-center text-xs">
            {task.subtasks.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <List size={12} className="mr-1 text-gray-500" />
                    <span className="text-gray-500">{task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length}</span>
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
                  <div className="flex items-center">
                    <MessageSquare size={12} className="mr-1 text-gray-500" />
                    <span className="text-gray-500">{task.notes.length}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.notes.length} note{task.notes.length !== 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          {/* Subtasks - visible on hover */}
          {isHovered && task.subtasks.length > 0 && (
            <SubtasksList subtasks={task.subtasks} className="mt-1" />
          )}
          
          {/* Latest note - visible on hover */}
          {isHovered && task.notes.length > 0 && (
            <div className="mt-2 text-xs border-t border-gray-200 pt-1">
              <div className="font-medium text-gray-500">Latest note:</div>
              <div className="text-gray-600 mt-0.5 line-clamp-2">{task.notes[0].content}</div>
            </div>
          )}
        </CardContent>
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
