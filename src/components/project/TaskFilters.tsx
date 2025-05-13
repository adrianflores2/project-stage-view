import { useState, useEffect } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isPast } from 'date-fns';
import { Check, Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Project } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface FilterOptions {
  priority: string[];
  dueDate: {
    type: string | null;
    range?: { from: Date; to: Date } | null;
  };
  status: string[];
  projectIds: string[];
  assignedToUserId?: string | undefined;
}

interface TaskFiltersProps {
  projects: Project[];
  filterOptions: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export const defaultFilterOptions: FilterOptions = {
  priority: [],
  dueDate: { type: null, range: null },
  status: [],
  projectIds: [],
  assignedToUserId: undefined,
};

const TaskFilters = ({ projects, filterOptions, onFilterChange }: TaskFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filterOptions);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  useEffect(() => {
    // Update local filters when external filters change
    setLocalFilters(filterOptions);
  }, [filterOptions]);

  // Calculate active filter count
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (localFilters.priority.length > 0) count++;
    if (localFilters.dueDate.type) count++;
    if (localFilters.status.length > 0) count++;
    if (localFilters.projectIds.length > 0) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const handlePriorityChange = (value: string) => {
    setLocalFilters(prev => {
      const updated = { ...prev };
      if (updated.priority.includes(value)) {
        updated.priority = updated.priority.filter(p => p !== value);
      } else {
        updated.priority = [...updated.priority, value];
      }
      return updated;
    });
  };

  const handleStatusChange = (value: string) => {
    setLocalFilters(prev => {
      const updated = { ...prev };
      if (updated.status.includes(value)) {
        updated.status = updated.status.filter(s => s !== value);
      } else {
        updated.status = [...updated.status, value];
      }
      return updated;
    });
  };

  const handleProjectChange = (projectId: string) => {
    setLocalFilters(prev => {
      const updated = { ...prev };
      if (updated.projectIds.includes(projectId)) {
        updated.projectIds = updated.projectIds.filter(id => id !== projectId);
      } else {
        updated.projectIds = [...updated.projectIds, projectId];
      }
      return updated;
    });
  };

  const handleDueDateChange = (type: string) => {
    const today = new Date();
    let range = null;

    switch (type) {
      case 'today':
        range = { from: startOfToday(), to: endOfToday() };
        break;
      case 'thisWeek':
        range = { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
        break;
      case 'thisMonth':
        range = { from: startOfMonth(today), to: endOfMonth(today) };
        break;
      case 'overdue':
        // Overdue is handled differently - we'll filter tasks where due date is in the past
        range = null;
        break;
      default:
        range = null;
    }

    setLocalFilters(prev => ({
      ...prev,
      dueDate: { type, range }
    }));
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setLocalFilters(prev => ({
        ...prev,
        dueDate: { 
          type: 'custom', 
          range: { from: date, to: date } 
        }
      }));
      setDatePickerOpen(false);
    }
  };

  const handleResetFilters = () => {
    setLocalFilters(defaultFilterOptions);
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter size={16} className="mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-accent text-accent-foreground" variant="secondary">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-72 p-4"
        align="start"
        sideOffset={5}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filter Tasks</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResetFilters}
              className="h-8 px-2 text-xs"
            >
              Reset
            </Button>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-1">Priority</h4>
            <div className="grid grid-cols-3 gap-2">
              {['Alta', 'Media', 'Baja'].map(priority => (
                <div 
                  key={priority}
                  className={cn(
                    "flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium cursor-pointer border",
                    localFilters.priority.includes(priority) 
                      ? "bg-accent border-accent" 
                      : "border-input hover:bg-accent/20"
                  )}
                  onClick={() => handlePriorityChange(priority)}
                >
                  {priority}
                  {localFilters.priority.includes(priority) && (
                    <Check size={12} className="ml-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-1">Due Date</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'today', label: 'Today' },
                { id: 'thisWeek', label: 'This Week' },
                { id: 'thisMonth', label: 'This Month' },
                { id: 'overdue', label: 'Overdue' }
              ].map(option => (
                <div 
                  key={option.id}
                  className={cn(
                    "flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium cursor-pointer border",
                    localFilters.dueDate.type === option.id 
                      ? "bg-accent border-accent" 
                      : "border-input hover:bg-accent/20"
                  )}
                  onClick={() => handleDueDateChange(option.id)}
                >
                  {option.label}
                  {localFilters.dueDate.type === option.id && (
                    <Check size={12} className="ml-1" />
                  )}
                </div>
              ))}
            </div>
            
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs justify-start"
                >
                  <CalendarIcon size={14} className="mr-2" />
                  {localFilters.dueDate.type === 'custom' && localFilters.dueDate.range
                    ? format(localFilters.dueDate.range.from, 'PPP')
                    : "Select Specific Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localFilters.dueDate.type === 'custom' && localFilters.dueDate.range 
                    ? localFilters.dueDate.range.from 
                    : undefined}
                  onSelect={handleCalendarSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-1">Status</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'not-started', label: 'Not Started' },
                { id: 'in-progress', label: 'In Progress' },
                { id: 'paused', label: 'Paused' },
                { id: 'completed', label: 'Completed' }
              ].map(status => (
                <div 
                  key={status.id}
                  className={cn(
                    "flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium cursor-pointer border",
                    localFilters.status.includes(status.id) 
                      ? "bg-accent border-accent" 
                      : "border-input hover:bg-accent/20"
                  )}
                  onClick={() => handleStatusChange(status.id)}
                >
                  {status.label}
                  {localFilters.status.includes(status.id) && (
                    <Check size={12} className="ml-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-1">Projects</h4>
            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {projects.map(project => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`project-${project.id}`} 
                      checked={localFilters.projectIds.includes(project.id)}
                      onCheckedChange={() => handleProjectChange(project.id)}
                    />
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: project.color || '#4A6FDC' }}
                    />
                    <Label 
                      htmlFor={`project-${project.id}`}
                      className="text-sm cursor-pointer flex-1 truncate"
                    >
                      {project.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <DropdownMenuSeparator />
          
          <Button onClick={handleApplyFilters} className="w-full">
            Apply Filters
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TaskFilters;
