
import React, { useMemo } from 'react';
import { Task } from '@/types';
import TaskGridCard from './TaskGridCard';
import TaskListCard from './TaskListCard';

interface TaskCardProps {
  task: Task;
  projectColor: string;
  viewMode: 'grid' | 'list';
  showMinimalInfo?: boolean;
}

const TaskCardComponent = ({ task, projectColor, viewMode, showMinimalInfo = false }: TaskCardProps) => {
  const content = useMemo(() => {
    if (viewMode === 'grid') {
      return <TaskGridCard task={task} projectColor={projectColor} showMinimalInfo={showMinimalInfo} />;
    }
    return <TaskListCard task={task} projectColor={projectColor} showMinimalInfo={showMinimalInfo} />;
  }, [task.id, task.status, task.progress]);

  return content;
};

const TaskCard = React.memo(TaskCardComponent);

export default TaskCard;
