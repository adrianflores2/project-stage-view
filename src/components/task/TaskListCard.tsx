
import React, { useState } from 'react';
import { Task } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { List, MessageSquare, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { getBackgroundTint, priorityColors } from './TaskCardStyles';
import TaskBadge from './TaskBadge';
import TaskDate from './TaskDate';
import SubtasksList from './SubtasksList';
import TaskDetail from '../TaskDetail';
import { 
  HoverCard,
  HoverCardTrigger,
  HoverCardContent
} from '@/components/ui/hover-card';

interface TaskListCardProps {
  task: Task;
  projectColor: string;
  showMinimalInfo?: boolean;
}

const TaskListCard = ({ task, projectColor, showMinimalInfo = false }: TaskListCardProps) => {
  const { getUserById } = useAppContext();
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  
  const assignedUser = getUserById(task.assignedTo || task.assigned_to || '');
  
  // Handler to open details and close hover card
  const handleOpenDetails = () => {
    setIsHoverOpen(false); // Close hover card when opening details
    setShowDetailDialog(true);
  };
  
  // For completed tasks with minimal info
  if (showMinimalInfo && task.status === 'completed') {
    return (
      <>
        <HoverCard open={isHoverOpen} onOpenChange={setIsHoverOpen}>
          <HoverCardTrigger asChild>
            <div 
              className="bg-white border rounded-md p-2.5 cursor-pointer hover:bg-gray-50 transition-colors group"
              onClick={handleOpenDetails}
              style={{ background: getBackgroundTint(projectColor) }}
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
                    
                    {/* Completed Date */}
                    <span>Completed: {format(new Date(task.completedDate || task.completed_date!), 'MMM d, yyyy')}</span>
                    
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
              
              {/* Show subtasks on hover */}
              {task.subtasks.length > 0 && (
                <SubtasksList 
                  subtasks={task.subtasks}
                  className="mt-2 space-y-1 hidden group-hover:block" 
                />
              )}
            </div>
          </HoverCardTrigger>
          
          {task.notes.length > 0 && (
            <HoverCardContent className="w-80 p-4" side="right">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Task Notes</h4>
                <div className="space-y-2 max-h-60 overflow-auto">
                  {task.notes.slice(0, 3).map(note => (
                    <div key={note.id} className="text-xs border-l-2 border-gray-300 pl-2">
                      <p className="line-clamp-2">{note.content}</p>
                      <div className="text-xs text-gray-500 mt-1 flex justify-between">
                        <span>{note.author}</span>
                        <span>{format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  ))}
                  {task.notes.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{task.notes.length - 3} more notes
                    </div>
                  )}
                </div>
              </div>
            </HoverCardContent>
          )}
        </HoverCard>
        
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
      <HoverCard open={isHoverOpen} onOpenChange={setIsHoverOpen}>
        <HoverCardTrigger asChild>
          <div 
            className="bg-white border rounded-md p-2.5 cursor-pointer hover:bg-gray-50 transition-colors group"
            onClick={handleOpenDetails}
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
                  
                  <TaskDate dueDate={task.dueDate || task.due_date} />
                  
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
        </HoverCardTrigger>
        
        {task.notes.length > 0 && (
          <HoverCardContent className="w-80 p-4" side="right">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Task Notes</h4>
              <div className="space-y-2 max-h-60 overflow-auto">
                {task.notes.slice(0, 3).map(note => (
                  <div key={note.id} className="text-xs border-l-2 border-gray-300 pl-2">
                    <p className="line-clamp-2">{note.content}</p>
                    <div className="text-xs text-gray-500 mt-1 flex justify-between">
                      <span>{note.author}</span>
                      <span>{format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                ))}
                {task.notes.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{task.notes.length - 3} more notes
                  </div>
                )}
              </div>
            </div>
          </HoverCardContent>
        )}
      </HoverCard>
      
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
