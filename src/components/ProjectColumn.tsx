
import { Project, Task } from '@/types';
import TaskCard from './TaskCard';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trash } from 'lucide-react';
import { useState } from 'react';

interface ProjectColumnProps {
  project: Project;
  tasks: Task[];
  viewMode: 'grid' | 'list';
  onDeleteProject?: () => void;
}

const ProjectColumn = ({ project, tasks, viewMode, onDeleteProject }: ProjectColumnProps) => {
  const [collapsed, setCollapsed] = useState(false);
  
  // Group tasks by project stage
  const tasksByStage: Record<string, Task[]> = {};
  
  // Make sure we use project.stages array to maintain order
  project.stages.forEach(stage => {
    tasksByStage[stage] = [];
  });
  
  // Then add tasks to their respective stages
  tasks.forEach(task => {
    if (task.projectStage) {
      if (!tasksByStage[task.projectStage]) {
        tasksByStage[task.projectStage] = [];
      }
      tasksByStage[task.projectStage].push(task);
    }
  });
  
  // Check if there are any tasks in any stage
  const hasTasks = Object.values(tasksByStage).some(stageTasks => stageTasks.length > 0);
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </Button>
          <h2 className="text-lg font-semibold flex items-center">
            <span 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: project.color }}
            ></span>
            {project.name}
          </h2>
        </div>
        
        {onDeleteProject && (
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDeleteProject}
          >
            <Trash size={16} />
          </Button>
        )}
      </div>
      
      {!collapsed && (
        hasTasks ? (
          <div className="space-y-6">
            {project.stages.map(stage => {
              const stageTasks = tasksByStage[stage] || [];
              if (stageTasks.length === 0) return null;
              
              return (
                <div key={`${project.id}-${stage}`} className="pl-8">
                  <h3 className="text-md font-medium mb-3">{stage}</h3>
                  <div className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'
                      : 'space-y-1'
                  }>
                    {stageTasks.map(task => (
                      <TaskCard 
                        key={task.id}
                        task={task}
                        projectColor={project.color}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pl-8 p-4 text-center text-sm text-gray-500 italic">
            No active tasks for this project
          </div>
        )
      )}
    </div>
  );
};

export default ProjectColumn;
