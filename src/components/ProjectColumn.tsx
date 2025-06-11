
import { useEffect, useState } from 'react';
import { Project, Task } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trash } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import DraggableTaskCard from './DraggableTaskCard';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';

const DroppableStage: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="min-h-4">
      {children}
    </div>
  );
};

interface ProjectColumnProps {
  project: Project;
  tasks: Task[];
  viewMode: 'grid' | 'list';
  onDeleteProject?: () => void;
}

const ProjectColumn = ({ project, tasks, viewMode, onDeleteProject }: ProjectColumnProps) => {
  const { updateTask } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);
  const [stageMap, setStageMap] = useState<Record<string, string>>({});
  const [tasksByStage, setTasksByStage] = useState<Record<string, Task[]>>({});

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    const loadStages = async () => {
      const { data } = await supabase
        .from('project_stages')
        .select('id,name')
        .eq('project_id', project.id);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(s => {
          map[s.name] = s.id;
        });
        setStageMap(map);
      }
    };
    loadStages();
  }, [project.id]);

  useEffect(() => {
    const grouped: Record<string, Task[]> = {};
    project.stages.forEach(stage => {
      grouped[stage] = [];
    });
    tasks.forEach(task => {
      if (task.projectStage && grouped[task.projectStage]) {
        grouped[task.projectStage].push(task);
      }
    });
    Object.keys(grouped).forEach(stage => {
      grouped[stage].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    });
    setTasksByStage(grouped);
  }, [tasks, project.stages]);

  const hasTasks = Object.values(tasksByStage).some(stageTasks => stageTasks.length > 0);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const fromStage = active.data.current?.stage as string;
    let toStage = over.data.current?.stage as string | undefined;
    if (!toStage) {
      toStage = over.id as string;
    }
    if (!fromStage || !toStage) return;

    if (fromStage === toStage && active.id === over.id) return;

    const fromIndex = tasksByStage[fromStage].findIndex(t => t.id === active.id);
    let toIndex = tasksByStage[toStage].findIndex(t => t.id === over.id);
    if (toIndex === -1) toIndex = tasksByStage[toStage].length;

    const updated = { ...tasksByStage };
    const [moved] = updated[fromStage].splice(fromIndex, 1);
    moved.projectStage = toStage;
    updated[toStage].splice(toIndex, 0, moved);

    Object.keys(updated).forEach(stage => {
      updated[stage] = updated[stage].map((t, i) => ({ ...t, position: i }));
    });

    setTasksByStage(updated);

    const stageId = stageMap[toStage];
    if (stageId) {
      moved.project_stage_id = stageId;
    }
    moved.position = updated[toStage].findIndex(t => t.id === moved.id);
    await updateTask(moved);
  };
  
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-6">
              {project.stages.map(stage => {
                const stageTasks = tasksByStage[stage] || [];
                if (stageTasks.length === 0) return null;

                return (
                  <div key={`${project.id}-${stage}`} className="pl-8">
                    <h3 className="text-md font-medium mb-3">{stage}</h3>
                    <DroppableStage id={stage}>
                      <SortableContext
                        items={stageTasks.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div
                          className={
                            viewMode === 'grid'
                              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'
                              : 'space-y-1'
                          }
                        >
                          {stageTasks.map(task => (
                            <DraggableTaskCard
                              key={task.id}
                              task={task}
                              projectColor={project.color}
                              viewMode={viewMode}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DroppableStage>
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
