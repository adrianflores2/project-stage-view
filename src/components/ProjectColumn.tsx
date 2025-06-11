
import { Project, Task } from '@/types';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import StageColumn from './StageColumn';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trash } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

interface ProjectColumnProps {
  project: Project;
  tasks: Task[];
  viewMode: 'grid' | 'list';
  onDeleteProject?: () => void;
}

const ProjectColumn = ({ project, tasks, viewMode, onDeleteProject }: ProjectColumnProps) => {
  const [collapsed, setCollapsed] = useState(false);
  
  const { updateTask } = useAppContext();

  const [tasksByStage, setTasksByStage] = useState<Record<string, Task[]>>(() => {
    const grouped: Record<string, Task[]> = {};
    project.stages.forEach(stage => { grouped[stage] = []; });
    tasks.forEach(task => {
      if (task.projectStage) {
        if (!grouped[task.projectStage]) grouped[task.projectStage] = [];
        grouped[task.projectStage].push(task);
      }
    });
    return grouped;
  });

  useEffect(() => {
    const grouped: Record<string, Task[]> = {};
    project.stages.forEach(stage => { grouped[stage] = []; });
    tasks.forEach(task => {
      if (task.projectStage) {
        if (!grouped[task.projectStage]) grouped[task.projectStage] = [];
        grouped[task.projectStage].push(task);
      }
    });
    setTasksByStage(grouped);
  }, [tasks, project.stages]);

  const sensors = useSensors(useSensor(PointerSensor));

  const findStageForTask = (taskId: string) => {
    return Object.keys(tasksByStage).find(stage =>
      tasksByStage[stage].some(t => t.id === taskId)
    );
  };

  const fetchStageId = async (stageName: string) => {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase
      .from('project_stages')
      .select('id')
      .eq('project_id', project.id)
      .eq('name', stageName)
      .single();
    return data?.id || '';
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const fromStage = findStageForTask(active.id as string);
    const toStage = over.id as string;
    if (!fromStage) return;

    if (fromStage === toStage && active.id === over.id) return;

    const sourceTasks = [...tasksByStage[fromStage]];
    const destTasks = fromStage === toStage ? sourceTasks : [...(tasksByStage[toStage] || [])];

    const oldIndex = sourceTasks.findIndex(t => t.id === active.id);
    const [moved] = sourceTasks.splice(oldIndex, 1);

    let newIndex = destTasks.findIndex(t => t.id === over.id);
    if (newIndex === -1) newIndex = destTasks.length;
    destTasks.splice(newIndex, 0, moved);

    const newState = { ...tasksByStage, [fromStage]: sourceTasks };
    newState[toStage] = destTasks;
    setTasksByStage(newState);

    const stageId = fromStage === toStage ? moved.project_stage_id : await fetchStageId(toStage);
    const updated: Task = { ...moved, projectStage: toStage, project_stage_id: stageId, position: newIndex };
    await updateTask(updated);
  };
  
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
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
              {project.stages.map(stage => {
                const stageTasks = tasksByStage[stage] || [];
                if (stageTasks.length === 0) return null;

                return (
                  <div key={`${project.id}-${stage}`} className="pl-8">
                    <h3 className="text-md font-medium mb-3">{stage}</h3>
                    <StageColumn
                      id={stage}
                      tasks={stageTasks}
                      projectColor={project.color}
                      viewMode={viewMode}
                    />
                  </div>
                );
              })}
            </div>
          </DndContext>
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
