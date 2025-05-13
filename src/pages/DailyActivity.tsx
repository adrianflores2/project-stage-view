
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { format, isToday, isYesterday, subDays, parseISO } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, Calendar } from 'lucide-react';
import { Task } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Helper function to format completion time consistently
const formatCompletionTime = (completionDate: Date | string | null | undefined) => {
  if (!completionDate) return 'Unknown';
  
  const dateObj = completionDate instanceof Date 
    ? completionDate 
    : typeof completionDate === 'string'
      ? parseISO(completionDate)
      : new Date(completionDate as any);
      
  return format(dateObj, 'h:mm a');
};

const DailyActivity = () => {
  const { tasks, getUserById, getProjectById } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<string>('today');
  
  // Get all completed tasks
  const completedTasks = tasks.filter(task => task.status === 'completed' && task.completedDate);
  
  // Filter tasks based on selected date
  const filteredTasks = completedTasks.filter(task => {
    if (!task.completedDate) return false;
    
    // Ensure we're working with a Date object by using parseISO for string dates
    const completedDate = task.completedDate instanceof Date 
      ? task.completedDate 
      : typeof task.completedDate === 'string'
        ? parseISO(task.completedDate)
        : new Date(task.completedDate as any); // Fallback to handle other cases
    
    switch(selectedDate) {
      case 'today':
        return isToday(completedDate);
      case 'yesterday':
        return isYesterday(completedDate);
      case 'last7days':
        const sevenDaysAgo = subDays(new Date(), 7);
        return completedDate >= sevenDaysAgo;
      default:
        return true; // 'all' option shows all completed tasks
    }
  });
  
  // Group tasks by date
  const tasksByDate = filteredTasks.reduce<Record<string, Task[]>>((groups, task) => {
    if (!task.completedDate) return groups;
    
    // Ensure we're working with a Date object
    const completedDate = task.completedDate instanceof Date 
      ? task.completedDate 
      : typeof task.completedDate === 'string'
        ? parseISO(task.completedDate)
        : new Date(task.completedDate as any); // Fallback to handle other cases
    
    const dateStr = format(completedDate, 'yyyy-MM-dd');
    
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    
    groups[dateStr].push(task);
    return groups;
  }, {});
  
  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(tasksByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center mb-4 sm:mb-0">
          <Calendar className="mr-2" /> Daily Activity
        </h1>
        
        <Select value={selectedDate} onValueChange={setSelectedDate}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last7days">Last 7 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {sortedDates.length === 0 ? (
        <Alert>
          <AlertDescription className="text-center py-6">
            No completed tasks for the selected period
          </AlertDescription>
        </Alert>
      ) : (
        sortedDates.map(dateStr => {
          const tasksForDate = tasksByDate[dateStr];
          const dateObj = new Date(dateStr);
          
          // Format the date header
          let dateHeader: string;
          if (isToday(dateObj)) {
            dateHeader = "Today";
          } else if (isYesterday(dateObj)) {
            dateHeader = "Yesterday";
          } else {
            dateHeader = format(dateObj, 'MMMM d, yyyy');
          }
          
          return (
            <div key={dateStr} className="mb-6">
              <h2 className="text-lg font-medium mb-3">{dateHeader}</h2>
              <div className="space-y-3">
                {tasksForDate.map(task => {
                  const assignedUser = getUserById(task.assignedTo);
                  const project = getProjectById(task.projectId);
                  
                  return (
                    <Card key={task.id} className="overflow-hidden">
                      <div 
                        className="h-1" 
                        style={{ backgroundColor: project?.color || '#cbd5e1' }}
                      ></div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center justify-between">
                          <div className="flex items-center">
                            <Check size={16} className="mr-2 text-green-500" />
                            {task.title}
                          </div>
                          <Badge variant="outline" className="bg-status-completed text-white">
                            Completed
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <div className="text-gray-500">Project: <span className="font-medium">{project?.name}</span></div>
                          <div className="text-gray-500">Stage: <span className="font-medium">{task.projectStage}</span></div>
                          <div className="text-gray-500">Assigned to: <span className="font-medium">{assignedUser?.name}</span></div>
                          {task.priority && (
                            <div className="text-gray-500">Priority: <span className="font-medium">{task.priority}</span></div>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                          Completed at: {formatCompletionTime(task.completedDate || task.completed_date)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default DailyActivity;
