
import React from 'react';
import { User } from '@/types';
import FilterableUserSelect from './FilterableUserSelect';
import ViewModeToggle from './ViewModeToggle';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectHeaderProps {
  selectedUserId: string | undefined;
  onUserChange: (userId: string | undefined) => void;
  selectedPriority?: string | undefined;
  onPriorityChange?: (priority: string | undefined) => void;
  selectedDueDateRange?: string | undefined;
  onDueDateRangeChange?: (range: string | undefined) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onCreateTask: () => void;
  filterableUsers: User[];
  canCreateTask: boolean;
}

const ProjectHeader = ({
  selectedUserId,
  onUserChange,
  selectedPriority,
  onPriorityChange,
  selectedDueDateRange,
  onDueDateRangeChange,
  viewMode,
  onViewModeChange,
  onCreateTask,
  filterableUsers,
  canCreateTask
}: ProjectHeaderProps) => {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {/* Row with Filters and Create Task button */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
        <div className="flex flex-wrap items-center gap-2 z-20 w-full md:w-auto">
          <FilterableUserSelect 
            users={filterableUsers}
            selectedUserId={selectedUserId}
            onUserChange={onUserChange}
          />

          {/* Priority filter */}
          {onPriorityChange && (
            <div className="flex items-center bg-white rounded-lg px-3 py-1 shadow">
              <Select
                value={selectedPriority || 'all'}
                onValueChange={(value) => onPriorityChange(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="border-0 h-8 p-0 w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Due date filter */}
          {onDueDateRangeChange && (
            <div className="flex items-center bg-white rounded-lg px-3 py-1 shadow">
              <Select
                value={selectedDueDateRange || 'all'}
                onValueChange={(value) => onDueDateRangeChange(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="border-0 h-8 p-0 w-[140px]">
                  <SelectValue placeholder="Due Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          
          {canCreateTask && (
            <Button
              onClick={onCreateTask}
              size="sm"
              className="ml-2 flex items-center gap-1"
            >
              <Plus size={16} />
              New Task
            </Button>
          )}
        </div>
      </div>
      
      {/* Hint for Project Coordinators about reordering */}
      {canCreateTask && (
        <div className="text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono">Tip:</span>  
          You can drag and drop projects to reorder them
        </div>
      )}
    </div>
  );
};

export default ProjectHeader;
