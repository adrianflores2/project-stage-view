
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Task, Project } from '@/types';
import { FilterOptions, defaultFilterOptions } from '@/components/project/TaskFilters';
import { isPast, isWithinInterval } from 'date-fns';

interface TaskFilterContextProps {
  filterOptions: FilterOptions;
  setFilterOptions: (filters: FilterOptions) => void;
  filteredTasks: Task[];
  resetFilters: () => void;
}

const TaskFilterContext = createContext<TaskFilterContextProps | undefined>(undefined);

export const TaskFilterProvider: React.FC<{ 
  children: ReactNode;
  tasks: Task[];
}> = ({ children, tasks }) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultFilterOptions);

  const applyFilters = (tasks: Task[]): Task[] => {
    return tasks.filter(task => {
      // Filter by priority
      if (filterOptions.priority.length > 0 && task.priority) {
        if (!filterOptions.priority.includes(task.priority)) {
          return false;
        }
      }

      // Filter by status
      if (filterOptions.status.length > 0) {
        if (!filterOptions.status.includes(task.status)) {
          return false;
        }
      }

      // Filter by project
      if (filterOptions.projectIds.length > 0) {
        const projectId = task.projectId || task.project_id;
        if (!projectId || !filterOptions.projectIds.includes(projectId)) {
          return false;
        }
      }

      // Filter by due date
      if (filterOptions.dueDate.type) {
        const dueDate = task.dueDate ? new Date(task.dueDate) : 
                       (task.due_date ? new Date(task.due_date) : null);
        
        if (!dueDate) {
          return false;
        }

        if (filterOptions.dueDate.type === 'overdue') {
          if (!isPast(dueDate)) {
            return false;
          }
        } else if (filterOptions.dueDate.range) {
          if (!isWithinInterval(dueDate, {
            start: filterOptions.dueDate.range.from,
            end: filterOptions.dueDate.range.to
          })) {
            return false;
          }
        }
      }

      return true;
    });
  };

  const filteredTasks = applyFilters(tasks);

  const resetFilters = () => {
    setFilterOptions(defaultFilterOptions);
  };

  return (
    <TaskFilterContext.Provider 
      value={{ 
        filterOptions, 
        setFilterOptions, 
        filteredTasks,
        resetFilters
      }}
    >
      {children}
    </TaskFilterContext.Provider>
  );
};

export const useTaskFilters = () => {
  const context = useContext(TaskFilterContext);
  if (context === undefined) {
    throw new Error('useTaskFilters must be used within a TaskFilterProvider');
  }
  return context;
};
