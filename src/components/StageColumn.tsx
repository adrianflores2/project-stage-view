import { useDroppable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '@/types';
import DraggableTaskCard from './DraggableTaskCard';

interface Props {
  id: string;
  tasks: Task[];
  projectColor: string;
  viewMode: 'grid' | 'list';
}

const StageColumn = ({ id, tasks, projectColor, viewMode }: Props) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={isOver ? 'bg-accent/20 p-1 rounded' : ''}>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <DraggableTaskCard key={task.id} task={task} projectColor={projectColor} viewMode={viewMode} />
        ))}
      </SortableContext>
    </div>
  );
};

export default StageColumn;
