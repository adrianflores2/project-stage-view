
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { format, isToday, isYesterday, subDays, isSameDay } from 'date-fns';
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
import { Check, Calendar, FileText, List, User } from 'lucide-react';
import { Task } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const DailyActivity = () => {
  const { tasks, getUserById, getProjectById } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<string>('today');
  
  // Get all completed tasks
  const completedTasks = tasks.filter(task => task.status === 'completed' && task.completedDate);
  
  // Filter tasks based on selected date
  const filteredTasks = completedTasks.filter(task => {
    if (!task.completedDate) return false;
    
    const completedDate = new Date(task.completedDate);
    
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
    
    const dateStr = format(new Date(task.completedDate), 'yyyy-MM-dd');
    
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

  // Group tasks by project
  const groupTasksByProject = (tasks: Task[]) => {
    return tasks.reduce<Record<string, Task[]>>((groups, task) => {
      if (!task.projectId) return groups;
      
      if (!groups[task.projectId]) {
        groups[task.projectId] = [];
      }
      
      groups[task.projectId].push(task);
      return groups;
    }, {});
  };

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
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500">No completed tasks for the selected period</div>
        </div>
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
          
          // Group tasks by project for this date
          const tasksByProject = groupTasksByProject(tasksForDate);
          const projectIds = Object.keys(tasksByProject);
          
          return (
            <div key={dateStr} className="mb-8">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <FileText className="mr-2" /> 
                {dateHeader} - {tasksForDate.length} completed task{tasksForDate.length !== 1 ? 's' : ''}
              </h2>
              
              <Accordion type="multiple" className="space-y-4">
                {projectIds.map(projectId => {
                  const project = getProjectById(projectId);
                  const projectTasks = tasksByProject[projectId];
                  
                  if (!project) return null;
                  
                  return (
                    <AccordionItem 
                      key={projectId} 
                      value={projectId}
                      className="border rounded-lg overflow-hidden"
                      style={{ borderTop: `3px solid ${project.color}` }}
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: project.color }}
                          ></div>
                          <span className="font-medium">{project.name}</span>
                          <Badge className="ml-2 bg-gray-200 text-gray-800">
                            {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 px-4 pb-4">
                          {projectTasks.map(task => {
                            const assignedUser = getUserById(task.assignedTo);
                            
                            return (
                              <Card key={task.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: project.color }}>
                                <CardHeader className="py-3">
                                  <CardTitle className="text-base flex items-center justify-between">
                                    <div className="flex items-center">
                                      <Check size={16} className="mr-2 text-green-500" />
                                      {task.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {task.completedDate && format(new Date(task.completedDate), 'h:mm a')}
                                    </div>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="py-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                                    <div className="flex items-center text-gray-700">
                                      <User size={14} className="mr-1.5" />
                                      Assigned to: <span className="font-medium ml-1">{assignedUser?.name}</span>
                                    </div>
                                    <div className="text-gray-700">
                                      Stage: <span className="font-medium">{task.projectStage}</span>
                                    </div>
                                    {task.priority && (
                                      <div className="text-gray-700">
                                        Priority: <span className="font-medium">{task.priority}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {task.description && (
                                    <div className="text-sm mb-3">
                                      <div className="font-medium mb-0.5">Description:</div>
                                      <p className="text-gray-600">{task.description}</p>
                                    </div>
                                  )}
                                  
                                  {task.subtasks.length > 0 && (
                                    <div className="mt-3">
                                      <div className="flex items-center mb-1 text-sm font-medium">
                                        <List size={14} className="mr-1.5" />
                                        Subtasks ({task.subtasks.filter(s => s.status === 'completed').length}/{task.subtasks.length} completed)
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {task.subtasks.map(subtask => (
                                          <div 
                                            key={subtask.id} 
                                            className={`text-xs py-1.5 px-2 flex items-center rounded-sm
                                              ${subtask.status === 'completed' 
                                                ? 'bg-green-50 text-green-800 border border-green-200' 
                                                : 'bg-gray-50 border border-gray-200'
                                              }`}
                                          >
                                            {subtask.status === 'completed' && <Check size={12} className="mr-1.5 text-green-600" />}
                                            {subtask.title}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          );
        })
      )}
    </div>
  );
};

export default DailyActivity;
