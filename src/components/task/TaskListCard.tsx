
import React, { useState } from 'react';
import { Task } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { List, MessageSquare, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  getBackgroundTint, 
  priorityColors, 
  getTaskBorderStyle
} from './TaskCardStyles';
import TaskBadge from './TaskBadge';
import SubtasksList from './SubtasksList';
import TaskDetail from '../TaskDetail';
import TaskDate from './TaskDate';

interface TaskListCardProps {
  task: Task;
  projectColor: string;
  showMinimalInfo?: boolean;
}

const TaskListCard = ({ task, projectColor, showMinimalInfo = false }: TaskListCardProps) => {
  const { getUserById } = useAppContext();
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const assignedUser = getUserById(task.assignedTo || task.assigned_to || '');
  
  // Handler to open details
  const handleOpenDetails = () => {
    setShowDetailDialog(true);
  };
  
  // For completed tasks with minimal info
  if (showMinimalInfo && task.status === 'completed') {
    return (
      <>
        <div 
          className="bg-white border rounded-md p-2 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={handleOpenDetails}
          style={{ background: getBackgroundTint(projectColor) }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-sm font-medium line-clamp-1">{task.title}</h3>
              
              <div className="flex items-center text-xs text-gray-500 mt-1">
                {/* Stage */}
                <span className="mr-2">{task.projectStage}</span>
                
                <div className="mx-2">|</div>
                
                {/* Assignee */}
                <User size={12} className="mr-1" />
                <span>{assignedUser?.name}</span>
                
                <div className="mx-2">|</div>
                
                {/* Due date */}
                <TaskDate dueDate={task.dueDate || task.due_date} status={task.status} />
                
                <div className="mx-2">|</div>
                
                {/* Completed Date */}
                <span>Completed: {task.completedDate || task.completed_date ? new Date(task.completedDate || task.completed_date!).toLocaleDateString() : ''}</span>
                
                {task.subtasks.length > 0 && (
                  <>
                    <div className="mx-2">|</div>
                    <List size={12} className="mr-1" />
                    <span>{task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Show content on hover */}
          {isHovered && (
            <div className="mt-2 space-y-2">
              {/* Subtasks on hover */}
              {task.subtasks.length > 0 && (
                <SubtasksList subtasks={task.subtasks} className="mt-1 space-y-1" />
              )}
              
              {/* Latest note on hover with white background */}
              {task.notes.length > 0 && (
                <div className="mt-2 text-xs border-t border-gray-200 pt-1">
                  <div className="font-medium text-gray-500">Latest note:</div>
                  <div className="text-gray-600 mt-0.5 line-clamp-2 bg-white p-1 rounded">{task.notes[0].content}</div>
                </div>
              )}
            </div>
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
  }
  
  // Regular list card display
  return (
    <>
      <div 
        className={`bg-white rounded-md p-2 cursor-pointer hover:bg-gray-50 transition-colors ${getTaskBorderStyle(task.status)}`}
        onClick={handleOpenDetails}
        style={{ background: getBackgroundTint(projectColor) }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-start gap-1">
              <h3 className="text-sm font-medium line-clamp-1">{task.title}</h3>
              <TaskBadge status={task.status} className="px-1.5 py-0 h-4" />
              {task.priority && (
                <span className={`ml-1 text-xs ${priorityColors[task.priority] || ''}`}>
                  P: {task.priority}
                </span>
              )}
            </div>
            
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <User size={12} className="mr-1" />
              <span>{assignedUser?.name}</span>
              
              <div className="mx-2">|</div>
              
              {/* Due date - show days left for in-progress tasks */}
              <TaskDate 
                dueDate={task.dueDate || task.due_date} 
                showDaysLeft={true}
                status={task.status}
              />
              
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
        
        {/* Show content on hover */}
        {isHovered && (
          <div className="mt-2 space-y-2">
            {/* Subtasks on hover */}
            {task.subtasks.length > 0 && (
              <SubtasksList subtasks={task.subtasks} className="mt-1 space-y-1" />
            )}
            
            {/* Latest note on hover with white background */}
            {task.notes.length > 0 && (
              <div className="mt-2 text-xs border-t border-gray-200 pt-1">
                <div className="font-medium text-gray-500">Latest note:</div>
                <div className="text-gray-600 mt-0.5 line-clamp-2 bg-white p-1 rounded">{task.notes[0].content}</div>
              </div>
            )}
          </div>
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
