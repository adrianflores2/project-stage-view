
import { useState } from 'react';
import { Task } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Check, Clock, List, MessageSquare, MoreVertical, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog } from '@/components/ui/dialog';
import TaskDetail from './TaskDetail';

interface TaskCardProps {
  task: Task;
  projectColor: string;
  viewMode: 'grid' | 'list';
}

const TaskCard = ({ task, projectColor, viewMode }: TaskCardProps) => {
  const { currentUser, getUserById } = useAppContext();
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const assignedUser = getUserById(task.assignedTo);
  
  // Status colors
  const statusColors = {
    'not-started': 'bg-status-notStarted',
    'in-progress': 'bg-status-inProgress',
    'paused': 'bg-status-paused',
    'completed': 'bg-status-completed'
  };

  // Priority colors
  const priorityColors: Record<string, string> = {
    'Alta': 'text-red-600',
    'Media': 'text-yellow-600',
    'Baja': 'text-blue-600'
  };

  // Format dates
  const formattedDueDate = task.dueDate ? format(new Date(task.dueDate), 'dd MMM') : 'No due date';
  
  // Calculate days remaining until due date for countdown
  const getDaysRemaining = () => {
    if (!task.dueDate) return null;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return differenceInDays(dueDate, today);
  };
  
  const daysRemaining = getDaysRemaining();
  
  // Get color for countdown based on days remaining
  const getCountdownColor = () => {
    if (daysRemaining === null) return 'bg-gray-300';
    if (daysRemaining <= 0) return 'bg-red-500';
    if (daysRemaining <= 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  // Calculate countdown progress (inverse of time remaining)
  const getCountdownProgress = () => {
    if (daysRemaining === null) return 0;
    // Use 10 days as the maximum scale
    return Math.max(0, Math.min(100, (10 - Math.min(daysRemaining, 10)) * 10));
  };
  
  // Permissions
  const canViewDetails = currentUser?.role === 'supervisor' || 
                          currentUser?.role === 'coordinator' || 
                          task.assignedTo === currentUser?.id;
  
  // Create a light background color for project tint (10% opacity)
  const getBackgroundTint = () => {
    // Convert hex to RGB with opacity
    const hex = projectColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  };
  
  if (viewMode === 'list') {
    return (
      <>
        <div 
          className="bg-white border rounded-md p-2.5 cursor-pointer hover:bg-gray-50 transition-colors group"
          onClick={() => canViewDetails && setShowDetailDialog(true)}
          style={{ background: getBackgroundTint() }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-start">
                <h3 className="text-sm font-medium line-clamp-1 mr-1.5">{task.title}</h3>
                <Badge variant="outline" className={`text-xs px-1.5 py-0 h-5 ${statusColors[task.status]}`}>
                  {task.status.replace(/-/g, ' ')}
                </Badge>
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
                
                <Clock size={12} className="mr-1" />
                <span>{formattedDueDate}</span>
                
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
          
          {/* Due date countdown */}
          {task.dueDate && (
            <div className="w-full h-0.5 bg-gray-100">
              <div 
                className={`h-full ${getCountdownColor()}`} 
                style={{ width: `${getCountdownProgress()}%` }}
              ></div>
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
  
  // Grid view (original card)
  return (
    <>
      <Card 
        className="task-card w-full cursor-pointer group hover:shadow-md transition-shadow"
        style={{ 
          borderLeft: `4px solid ${projectColor}`,
          background: getBackgroundTint()
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
            <Badge variant="outline" className={`text-xs px-2 ${statusColors[task.status]}`}>
              {task.status.replace(/-/g, ' ')}
            </Badge>
            <div className="text-xs text-gray-500 flex items-center">
              <Clock size={12} className="mr-1" />
              {formattedDueDate}
              {daysRemaining !== null && daysRemaining <= 2 && (
                <span className={daysRemaining <= 0 ? "text-red-500 ml-1 font-medium" : "text-yellow-600 ml-1 font-medium"}>
                  {daysRemaining <= 0 ? "Overdue!" : `${daysRemaining}d left`}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-3 pt-1 pb-2">
          {/* Task completion progress */}
          <Progress 
            value={task.progress} 
            className="h-1 mb-1"
            indicatorClassName={task.status === 'completed' ? 'bg-status-completed' : 'bg-status-inProgress'}
          />
          
          {/* Due date countdown progress */}
          {task.dueDate && (
            <Progress 
              value={getCountdownProgress()} 
              className="h-1 mb-2"
              indicatorClassName={getCountdownColor()}
            />
          )}
          
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
        </div>
        
        {/* Notes preview that shows on hover */}
        {task.notes.length > 0 && (
          <div className="p-0 hidden group-hover:block">
            <div className="bg-gray-50 w-full p-3 text-xs text-gray-600">
              <div className="font-medium mb-1">Latest note:</div>
              <p className="line-clamp-2">{task.notes[task.notes.length - 1].content}</p>
            </div>
          </div>
        )}
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

export default TaskCard;
