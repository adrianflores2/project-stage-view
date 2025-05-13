
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Project, Task } from '@/types';
import TaskCard from '../task/TaskCard';

interface CompletedTasksSectionProps {
  projectsWithCompletedTasks: Project[];
  getCompletedTasksForProject: (projectId: string) => Task[];
  viewMode: 'grid' | 'list';
}

const CompletedTasksSection = ({ 
  projectsWithCompletedTasks, 
  getCompletedTasksForProject,
  viewMode 
}: CompletedTasksSectionProps) => {
  const [showCompleted, setShowCompleted] = useState(false);
  
  if (projectsWithCompletedTasks.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-10 pt-4 border-t border-gray-200">
      <div className="flex items-center mb-4">
        <Check className="text-status-completed mr-2" />
        <h2 className="text-xl font-semibold">Completed Tasks</h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowCompleted(!showCompleted)}
          className="ml-3"
        >
          {showCompleted ? "Hide" : "Show"}
        </Button>
      </div>
      
      {showCompleted && (
        <div className="space-y-6 mt-2">
          {projectsWithCompletedTasks.map(project => (
            <div key={`completed-${project.id}`} className="bg-gray-50/50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <span 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: project.color }}
                ></span>
                <h3 className="text-md font-medium">{project.name}</h3>
              </div>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-1'}>
                {getCompletedTasksForProject(project.id).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    projectColor={project.color}
                    viewMode={viewMode}
                    showMinimalInfo={true}  // Add this prop to show minimal info for completed tasks
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedTasksSection;
