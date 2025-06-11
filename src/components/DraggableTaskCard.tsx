import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import { Task } from '@/types';

interface DraggableTaskCardProps {
  task: Task;
  projectColor: string;
  viewMode: 'grid' | 'list';
}

const DraggableTaskCard = ({ task, projectColor, viewMode }: DraggableTaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { stage: task.projectStage } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'ring-2 ring-primary/50' : ''}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} projectColor={projectColor} viewMode={viewMode} />
    </div>
  );
};

export default DraggableTaskCard;
