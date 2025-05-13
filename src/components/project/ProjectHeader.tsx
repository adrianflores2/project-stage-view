
import React, { useState, useEffect } from 'react';
import { Plus, Kanban, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, Project } from '@/types';
import FilterableUserSelect from './FilterableUserSelect';
import ViewModeToggle from './ViewModeToggle';
import TaskFilters, { FilterOptions, defaultFilterOptions } from './TaskFilters';
import { format } from 'date-fns';

interface ProjectHeaderProps {
  selectedUserId: string | undefined;
  onUserChange: (userId: string | undefined) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onCreateTask: () => void;
  filterableUsers: User[];
  canCreateTask: boolean;
  projects: Project[];
  filterOptions: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

const ProjectHeader = ({
  selectedUserId,
  onUserChange,
  viewMode,
  onViewModeChange,
  onCreateTask,
  filterableUsers,
  canCreateTask,
  projects,
  filterOptions,
  onFilterChange
}: ProjectHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center mb-2">
          <Kanban className="mr-2" /> Task Board
          <span className="text-sm font-normal text-gray-500 flex items-center ml-3">
            <Clock size={16} className="mr-1" />
            {format(currentTime, 'HH:mm')}
          </span>
        </h1>
        <p className="text-sm text-gray-500">
          View task board by project.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto mt-4 sm:mt-0">
        {filterableUsers.length > 0 && (
          <FilterableUserSelect 
            users={filterableUsers}
            selectedUserId={selectedUserId}
            onUserChange={onUserChange}
          />
        )}
        
        <TaskFilters
          projects={projects}
          filterOptions={filterOptions}
          onFilterChange={onFilterChange}
        />
        
        <ViewModeToggle 
          viewMode={viewMode} 
          onViewModeChange={onViewModeChange} 
        />
        
        {canCreateTask && (
          <Button onClick={onCreateTask} className="bg-accent hover:bg-accent/90">
            <Plus size={16} className="mr-1" /> New Task
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;
