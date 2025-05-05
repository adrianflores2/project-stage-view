
import { useState } from 'react';
import { Task, User, UserRole } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Check, Clock, List, MoreVertical, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import TaskDetail from './TaskDetail';

interface TaskCardProps {
  task: Task;
  projectColor: string;
}

const TaskCard = ({ task, projectColor }: TaskCardProps) => {
  const { currentUser, getUserById, getProjectById } = useAppContext();
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const assignedUser = getUserById(task.assignedTo);
  const project = getProjectById(task.projectId);
  
  // Status colors
  const statusColors = {
    'not-started': 'bg-status-notStarted',
    'in-progress': 'bg-status-inProgress',
    'paused': 'bg-status-paused',
    'completed': 'bg-status-completed'
  };

  // Format dates
  const formattedDueDate = task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No due date';
  
  // Permissions
  const canViewDetails = currentUser?.role === 'supervisor' || 
                          currentUser?.role === 'coordinator' || 
                          task.assignedTo === currentUser?.id;
  
  return (
    <>
      <Card 
        className="task-card w-full mb-3 cursor-pointer group hover:shadow-md transition-shadow"
        style={{ borderLeft: `4px solid ${projectColor}` }} 
        onClick={() => canViewDetails && setShowDetailDialog(true)}
      >
        <CardHeader className="p-3 pb-1">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium line-clamp-2">{task.title}</CardTitle>
            <div className="flex items-center space-x-1">
              {task.subtasks.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center text-xs text-gray-500">
                        <List size={14} className="mr-1" />
                        <span>{task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Subtasks completed</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {task.notes.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center text-xs text-gray-500">
                        <MessageSquare size={14} />
                        <span className="ml-1">{task.notes.length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{task.notes.length} note{task.notes.length !== 1 ? 's' : ''}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 pt-1 pb-2">
          <div className="w-full h-1 bg-gray-100 rounded-full mb-2">
            <div 
              className={`h-full rounded-full task-progress-bar ${
                task.status === 'completed' ? 'bg-status-completed' : 'bg-status-inProgress'
              }`} 
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-600">
              {assignedUser?.name}
            </div>
            <div className="text-xs font-medium">
              {task.progress}%
            </div>
          </div>
        </CardContent>
        
        {/* Notes preview that shows on hover */}
        {task.notes.length > 0 && (
          <CardFooter className="p-0 hidden task-notes">
            <div className="bg-gray-50 w-full p-3 text-xs text-gray-600">
              <div className="font-medium mb-1">Latest note:</div>
              <p className="line-clamp-2">{task.notes[task.notes.length - 1].content}</p>
            </div>
          </CardFooter>
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
