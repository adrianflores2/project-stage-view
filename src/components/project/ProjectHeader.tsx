
import React from 'react';
import { Plus, Kanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import FilterableUserSelect from './FilterableUserSelect';
import ViewModeToggle from './ViewModeToggle';

interface ProjectHeaderProps {
  selectedUserId: string | undefined;
  onUserChange: (userId: string | undefined) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onCreateTask: () => void;
  filterableUsers: User[];
  canCreateTask: boolean;
}

const ProjectHeader = ({
  selectedUserId,
  onUserChange,
  viewMode,
  onViewModeChange,
  onCreateTask,
  filterableUsers,
  canCreateTask
}: ProjectHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center mb-2">
          <Kanban className="mr-2" /> Task Board
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
