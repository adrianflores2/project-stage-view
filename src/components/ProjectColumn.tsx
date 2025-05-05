
import { Project, Task } from '@/types';
import { useAppContext } from '@/context/AppContext';
import TaskCard from './TaskCard';

interface ProjectColumnProps {
  project: Project;
  tasks: Task[];
}

const ProjectColumn = ({ project, tasks }: ProjectColumnProps) => {
  const { currentUser } = useAppContext();
  
  // Group tasks by project stage
  const tasksByStage = project.stages.reduce<Record<string, Task[]>>((result, stage) => {
    result[stage] = tasks.filter(task => task.projectStage === stage);
    return result;
  }, {});

  // Only show stages that have tasks or if user is coordinator (who can create tasks)
  const stagesToShow = project.stages.filter(
    stage => tasksByStage[stage].length > 0 || currentUser?.role === 'coordinator'
  );

  if (stagesToShow.length === 0) {
    return null; // No stages to show
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <span 
          className="w-3 h-3 rounded-full mr-2" 
          style={{ backgroundColor: project.color }}
        ></span>
        {project.name}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stagesToShow.map(stage => (
          <div key={`${project.id}-${stage}`}>
            <h3 className="text-sm font-medium text-gray-500 mb-2">{stage}</h3>
            <div className="space-y-2">
              {tasksByStage[stage].map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  projectColor={project.color} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectColumn;
