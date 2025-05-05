
import { Project, Task } from '@/types';
import { useAppContext } from '@/context/AppContext';
import TaskCard from './TaskCard';

interface ProjectColumnProps {
  project: Project;
  tasks: Task[];
  viewMode: 'grid' | 'list';
}

const ProjectColumn = ({ project, tasks, viewMode }: ProjectColumnProps) => {
  const { currentUser } = useAppContext();
  
  // Group tasks by project stage
  const tasksByStage = project.stages.reduce<Record<string, Task[]>>((result, stage) => {
    result[stage] = tasks.filter(task => task.projectStage === stage);
    return result;
  }, {});

  // Only show stages that have tasks (hide empty stages)
  const stagesToShow = project.stages.filter(
    stage => tasksByStage[stage].length > 0
  );

  if (stagesToShow.length === 0) {
    return null; // No stages with tasks to show
  }

  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <span 
          className="w-3 h-3 rounded-full mr-2" 
          style={{ backgroundColor: project.color }}
        ></span>
        <h2 className="text-lg font-semibold">{project.name}</h2>
      </div>
      
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stagesToShow.map(stage => (
            <div 
              key={`${project.id}-${stage}`} 
              className="bg-gray-50 p-4 rounded-lg"
              style={{ backgroundColor: `rgba(${project.color.replace('#', '').match(/../g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.05)` }}
            >
              <h3 className="text-sm font-medium text-gray-500 mb-3">{stage}</h3>
              <div className="space-y-3">
                {tasksByStage[stage].map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    projectColor={project.color}
                    viewMode="grid" 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {stagesToShow.map(stage => (
            <div key={`${project.id}-${stage}`}>
              <h3 className="text-sm font-medium text-gray-500 mb-2">{stage}</h3>
              <div className="space-y-1 mb-6">
                {tasksByStage[stage].map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    projectColor={project.color}
                    viewMode="list" 
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

export default ProjectColumn;
