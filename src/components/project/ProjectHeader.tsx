
import React from 'react';
import { User } from '@/types';
import ViewModeToggle from './ViewModeToggle';
import { Button } from '@/components/ui/button';
import { Filter, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
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
  // Function to get active filter count
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (selectedUserId) count++;
    if (selectedPriority) count++;
    if (selectedDueDateRange) count++;
    return count;
  };

  // Count active filters for badge
  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="mb-6 flex flex-col gap-3">
      {/* Row with Filters and Create Task button */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 z-20">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 flex items-center gap-2">
                <Filter size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary w-5 h-5 text-xs flex items-center justify-center text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">User</h4>
                  <Select
                    value={selectedUserId || 'all'}
                    onValueChange={(value) => onUserChange(value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {filterableUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Priority</h4>
                  <Select
                    value={selectedPriority || 'all'}
                    onValueChange={(value) => onPriorityChange && onPriorityChange(value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Due Date</h4>
                  <Select
                    value={selectedDueDateRange || 'all'}
                    onValueChange={(value) => onDueDateRangeChange && onDueDateRangeChange(value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Dates" />
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

                {/* Reset filters button */}
                {activeFilterCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => {
                      onUserChange(undefined);
                      onPriorityChange && onPriorityChange(undefined);
                      onDueDateRangeChange && onDueDateRangeChange(undefined);
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

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
