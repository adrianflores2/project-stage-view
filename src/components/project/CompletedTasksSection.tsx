
import { useState } from 'react';
import { Project, Task } from '@/types';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCard from '@/components/TaskCard';

// Helper function to format completion time consistently
const formatCompletionTime = (completionDate: Date | string | null | undefined) => {
  if (!completionDate) return 'Unknown';
  
  const dateObj = completionDate instanceof Date 
    ? completionDate 
    : typeof completionDate === 'string'
      ? parseISO(completionDate)
      : new Date(completionDate as any);
      
  return format(dateObj, 'h:mm a');
};

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
  const [expanded, setExpanded] = useState(false);
  
  // If there are no projects with completed tasks, don't show the section
  if (projectsWithCompletedTasks.length === 0) return null;
  
  return (
    <div className="border-t pt-6">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-8 w-8"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Button>
        <h2 className="text-lg font-semibold">Completed Tasks</h2>
      </div>
      
      {expanded && (
        <div className="space-y-6">
          {projectsWithCompletedTasks.map(project => {
            const completedTasks = getCompletedTasksForProject(project.id);
            
            return (
              <div key={project.id} className="pl-8">
                <h3 className="text-md font-medium mb-3 flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: project.color }}
                  ></span>
                  {project.name}
                </h3>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'
                    : 'space-y-1'
                }>
                  {completedTasks.map(task => (
                    <div key={task.id}>
                      <TaskCard 
                        task={task} 
                        projectColor={project.color} 
                        viewMode={viewMode}
                        showMinimalInfo={true}
                      />
                      <div className="text-xs text-gray-500 mt-1 ml-1">
                        Completed at: {formatCompletionTime(task.completedDate || task.completed_date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompletedTasksSection;
