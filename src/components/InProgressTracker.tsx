
import { useAppContext } from '@/context/AppContext';
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Kanban, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const InProgressTracker = () => {
  const { getTasksInProgress, getUserById, getProjectById } = useAppContext();
  const tasksInProgress = getTasksInProgress();
  
  // Group tasks by project
  const tasksByProject: Record<string, Task[]> = {};
  tasksInProgress.forEach(task => {
    if (!tasksByProject[task.projectId]) {
      tasksByProject[task.projectId] = [];
    }
    tasksByProject[task.projectId].push(task);
  });
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold flex items-center mb-6">
        <Kanban className="mr-2" /> In-Progress Tasks
      </h1>
      
      {Object.keys(tasksByProject).length > 0 ? (
        Object.entries(tasksByProject).map(([projectId, tasks]) => {
          const project = getProjectById(projectId);
          
          return (
            <Card key={projectId} className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: project?.color || '#cbd5e1' }}
                  ></span>
                  {project?.name || 'Unknown Project'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map(task => {
                    const assignedUser = getUserById(task.assignedTo);
                    const inProgressSubtasks = task.subtasks.filter(st => st.status === 'in-progress');
                    
                    return (
                      <div key={task.id} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <Badge variant="outline" className="bg-status-inProgress">
                            {task.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-500 flex items-center mb-3">
                          <User size={14} className="mr-1" />
                          {assignedUser?.name}
                          
                          {task.dueDate && (
                            <span className="ml-4">
                              Due: {format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Progress: {task.progress}%</div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="bg-status-inProgress h-2 rounded-full"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {inProgressSubtasks.length > 0 && (
                          <div className="mt-3">
                            <div className="text-sm font-medium mb-1">
                              In-Progress Subtasks:
                            </div>
                            <ul className="space-y-1">
                              {inProgressSubtasks.map(subtask => (
                                <li 
                                  key={subtask.id} 
                                  className="text-sm flex items-center py-1 px-2 bg-white rounded border border-gray-200"
                                >
                                  <Check size={14} className="mr-2 text-status-inProgress" />
                                  {subtask.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <div className="text-center py-12 text-gray-500">
          No tasks currently in progress
        </div>
      )}
    </div>
  );
};

export default InProgressTracker;
