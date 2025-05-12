
import React, { useState } from 'react';
import { Task } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { List, MessageSquare, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { getBackgroundTint, priorityColors } from './TaskCardStyles';
import TaskBadge from './TaskBadge';
import TaskProgress from './TaskProgress';
import TaskDate from './TaskDate';
import SubtasksList from './SubtasksList';
import TaskDetail from '../TaskDetail';
import { 
  HoverCard,
  HoverCardTrigger,
  HoverCardContent
} from '@/components/ui/hover-card';

interface TaskGridCardProps {
  task: Task;
  projectColor: string;
  showMinimalInfo?: boolean;
}

const TaskGridCard = ({ task, projectColor, showMinimalInfo = false }: TaskGridCardProps) => {
  const { getUserById } = useAppContext();
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const assignedUser = getUserById(task.assignedTo || task.assigned_to || '');
  
  // For completed tasks with minimal info
  if (showMinimalInfo && task.status === 'completed') {
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => setShowDetailDialog(true)}
            style={{ background: getBackgroundTint(projectColor) }}
          >
            <CardHeader className="p-3 pb-0">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium line-clamp-1">{task.title}</h3>
              </div>
            </CardHeader>
            
            <CardContent className="p-3 pt-2 space-y-2">
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
              
              {/* Subtasks - only visible on hover */}
              {task.subtasks.length > 0 && (
                <div className="text-xs flex items-center gap-1">
                  <List size={12} className="mr-1 text-gray-500" />
                  <span className="text-gray-500">{task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length}</span>
                  <SubtasksList subtasks={task.subtasks} className="mt-2 hidden group-hover:block" />
                </div>
              )}
            </CardContent>
            
            {showDetailDialog && (
              <TaskDetail 
                task={task} 
                projectColor={projectColor}
                open={showDetailDialog}
                onOpenChange={setShowDetailDialog}
              />
            )}
          </Card>
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
    );
  }
  
  // Regular card display
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => setShowDetailDialog(true)}
          style={{ background: getBackgroundTint(projectColor) }}
        >
          <CardHeader className="p-3 pb-0">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium line-clamp-1">{task.title}</h3>
              <TaskBadge status={task.status} />
            </div>
          </CardHeader>
          
          <CardContent className="p-3 pt-2 space-y-2">
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
            
            <TaskDate dueDate={task.dueDate || task.due_date} />
            
            <TaskProgress progress={task.progress} status={task.status} />
            
            <div className="flex justify-between items-center text-xs mt-2">
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
            
            {/* Subtasks - only visible on hover */}
            {task.subtasks.length > 0 && (
              <SubtasksList 
                subtasks={task.subtasks}
                className="mt-2 hidden group-hover:block" 
              />
            )}
          </CardContent>
          
          {showDetailDialog && (
            <TaskDetail 
              task={task} 
              projectColor={projectColor}
              open={showDetailDialog}
              onOpenChange={setShowDetailDialog}
            />
          )}
        </Card>
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
  );
};

export default TaskGridCard;
