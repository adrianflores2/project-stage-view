
import React, { useState, useEffect } from 'react';
import { Plus, Kanban, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, TaskStatus } from '@/types';
import FilterableUserSelect from './FilterableUserSelect';
import ViewModeToggle from './ViewModeToggle';
import { format } from 'date-fns';
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
} from "@/components/ui/select";

interface ProjectHeaderProps {
  selectedUserId: string | undefined;
  onUserChange: (userId: string | undefined) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onCreateTask: () => void;
  filterableUsers: User[];
  canCreateTask: boolean;
  selectedPriority?: string;
  onPriorityChange: (priority: string | undefined) => void;
  selectedStatus?: TaskStatus;
  onStatusChange: (status: TaskStatus | undefined) => void;
  selectedDueDate?: string;
  onDueDateChange: (dueDate: string | undefined) => void;
}

const ProjectHeader = ({
  selectedUserId,
  onUserChange,
  viewMode,
  onViewModeChange,
  onCreateTask,
  filterableUsers,
  canCreateTask,
  selectedPriority,
  onPriorityChange,
  selectedStatus,
  onStatusChange,
  selectedDueDate,
  onDueDateChange
}: ProjectHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Count active filters
  const activeFilterCount = [
    selectedUserId, 
    selectedPriority, 
    selectedStatus, 
    selectedDueDate
  ].filter(Boolean).length;
  
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
        {/* Advanced Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter size={16} className="mr-1" /> 
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 absolute -top-1 -right-1">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Filter Tasks</h4>
              
              {/* User filter */}
              {filterableUsers.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium">Assignee</label>
                  <FilterableUserSelect 
                    users={filterableUsers}
                    selectedUserId={selectedUserId}
                    onUserChange={onUserChange}
                  />
                </div>
              )}
              
              {/* Priority filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium">Priority</label>
                <Select
                  value={selectedPriority || "all"}
                  onValueChange={(value) => onPriorityChange(value === "all" ? undefined : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="Alta">High</SelectItem>
                    <SelectItem value="Media">Medium</SelectItem>
                    <SelectItem value="Baja">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Status filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium">Status</label>
                <Select
                  value={selectedStatus || "all"}
                  onValueChange={(value) => onStatusChange(value === "all" ? undefined : value as TaskStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="not-started">Not Started</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Due date filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium">Due Date</label>
                <Select
                  value={selectedDueDate || "all"}
                  onValueChange={(value) => onDueDateChange(value === "all" ? undefined : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Due Today</SelectItem>
                    <SelectItem value="week">Due This Week</SelectItem>
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
                    onPriorityChange(undefined);
                    onStatusChange(undefined);
                    onDueDateChange(undefined);
                  }}
                >
                  Reset All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
        
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
