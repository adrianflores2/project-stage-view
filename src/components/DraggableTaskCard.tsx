import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import { Task } from '@/types';

interface Props {
  task: Task;
  projectColor: string;
  viewMode: 'grid' | 'list';
}

const DraggableTaskCard = ({ task, projectColor, viewMode }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-50' : ''}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} projectColor={projectColor} viewMode={viewMode} />
    </div>
  );
};

export default DraggableTaskCard;
