
import React from 'react';
import { Task } from '@/types';
import TaskGridCard from './TaskGridCard';
import TaskListCard from './TaskListCard';

interface TaskCardProps {
  task: Task;
  projectColor: string;
  viewMode: 'grid' | 'list';
}

const TaskCard = ({ task, projectColor, viewMode }: TaskCardProps) => {
  return viewMode === 'list' 
    ? <TaskListCard task={task} projectColor={projectColor} /> 
    : <TaskGridCard task={task} projectColor={projectColor} />;
};

export default TaskCard;
