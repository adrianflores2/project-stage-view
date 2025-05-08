
import React from 'react';
import { Task } from '@/types';
import TaskGridCard from './TaskGridCard';
import TaskListCard from './TaskListCard';

interface TaskCardProps {
  task: Task;
  projectColor: string;
  viewMode: 'grid' | 'list';
  showMinimalInfo?: boolean;
}

const TaskCard = ({ task, projectColor, viewMode, showMinimalInfo = false }: TaskCardProps) => {
  if (viewMode === 'grid') {
    return <TaskGridCard task={task} projectColor={projectColor} showMinimalInfo={showMinimalInfo} />;
  } else {
    return <TaskListCard task={task} projectColor={projectColor} showMinimalInfo={showMinimalInfo} />;
  }
};

export default TaskCard;
