
import { useAppContext } from '@/context/AppContext';
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Kanban, User, Edit, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useState } from 'react';
import TaskDetail from './TaskDetail';
import { Dialog } from '@/components/ui/dialog';

const InProgressTracker = () => {
  const { getTasksInProgress, getUserById, getProjectById } = useAppContext();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const tasksInProgress = getTasksInProgress().filter(task => 
    task.status === 'in-progress' || 
    task.subtasks.some(subtask => subtask.status === 'in-progress')
  );
  
  // Group tasks by project
  const tasksByProject: Record<string, Task[]> = {};
  tasksInProgress.forEach(task => {
    const projectId = task.projectId || task.project_id;
    if (!projectId) return;
    
    if (!tasksByProject[projectId]) {
      tasksByProject[projectId] = [];
    }
    tasksByProject[projectId].push(task);
  });

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold flex items-center mb-6">
        <Kanban className="mr-2" /> In-Progress Tasks
      </h1>
      
      {Object.keys(tasksByProject).length > 0 ? (
        Object.entries(tasksByProject).map(([projectId, tasks]) => {
          const project = getProjectById(projectId);
          
          // Create project background tint
          const getBackgroundTint = () => {
            if (!project?.color) return 'rgba(203, 213, 225, 0.05)';
            // Convert hex to RGB with opacity
            const hex = project.color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, 0.05)`;
          };
          
          return (
            <Card key={projectId} className="mb-6" style={{ background: getBackgroundTint() }}>
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
                    const assignedUser = getUserById(task.assignedTo || task.assigned_to || '');
                    const inProgressSubtasks = task.subtasks.filter(st => st.status === 'in-progress');
                    const dueDate = task.dueDate || task.due_date;
                    
                    return (
                      <div key={task.id} className="bg-white p-3 rounded-md shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-status-inProgress">
                              {task.status}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                              onClick={() => handleEditTask(task)}
                            >
                              <Edit size={14} />
                              <span className="sr-only">Edit task</span>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-500 flex items-center mb-3">
                          <User size={14} className="mr-1" />
                          {assignedUser?.name || 'Unassigned'}
                          
                          {dueDate && (
                            <span className="ml-4 flex items-center">
                              <Calendar size={14} className="mr-1" />
                              Due: {format(new Date(dueDate), 'MMM d')}
                              {getDaysRemaining(dueDate) !== null && (
                                <span className={getDueStyle(getDaysRemaining(dueDate))}>
                                  ({getDaysRemaining(dueDate)} days left)
                                </span>
                              )}
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
                        
                        {/* Show only in-progress subtasks */}
                        {inProgressSubtasks.length > 0 && (
                          <div className="mt-3">
                            <div className="text-sm font-medium mb-2">
                              In-Progress Subtasks:
                            </div>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                              {inProgressSubtasks.map(subtask => (
                                <li 
                                  key={subtask.id} 
                                  className="text-xs flex items-center py-1 px-2 bg-gray-50 rounded border border-blue-200"
                                >
                                  <Check size={12} className="mr-2 bg-status-inProgress" />
                                  <span className="mr-1">{subtask.title}</span>
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

      {/* Dialog for editing task */}
      {editingTask && (
        <TaskDetail 
          task={editingTask} 
          projectColor={getProjectById(editingTask.projectId || editingTask.project_id || '')?.color || '#cbd5e1'}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
        />
      )}
    </div>
  );
};

// Helper function to calculate days remaining
const getDaysRemaining = (dueDate: Date | string) => {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to get style for due days
const getDueStyle = (days: number | null) => {
  if (days === null) return '';
  if (days <= 0) return 'ml-1 text-red-500 font-medium';
  if (days <= 2) return 'ml-1 text-yellow-600 font-medium';
  return 'ml-1 text-green-600 font-medium';
};

export default InProgressTracker;
