
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import ProjectColumn from './ProjectColumn';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Filter, Plus, Kanban } from 'lucide-react';
import CreateTaskDialog from './CreateTaskDialog';

const ProjectBoard = () => {
  const { currentUser, projects, users, getFilteredTasks } = useAppContext();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Changed default to 'grid'
  
  // Determine which users can be filtered based on role
  let filterableUsers = [];
  if (currentUser?.role === 'coordinator' || currentUser?.role === 'supervisor') {
    filterableUsers = users.filter(user => user.role === 'worker');
  } else if (currentUser?.role === 'worker') {
    filterableUsers = [currentUser]; // Workers can only see their own tasks
  }
  
  // Get tasks based on filters
  const getTasksForProject = (projectId: string) => {
    // For workers, always filter by their ID
    if (currentUser?.role === 'worker') {
      return getFilteredTasks(projectId, currentUser.id);
    }
    // For others, apply the selected user filter if any
    return getFilteredTasks(projectId, selectedUserId);
  };
  
  return (
    <div className="p-4">
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
          {(currentUser?.role === 'coordinator' || currentUser?.role === 'supervisor') && (
            <div className="flex items-center bg-white rounded-lg px-3 py-1 shadow">
              <Filter size={16} className="text-gray-500 mr-2" />
              <Select
                value={selectedUserId || 'all'}
                onValueChange={(value) => setSelectedUserId(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="border-0 h-8 p-0">
                  <SelectValue placeholder="All Workers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workers</SelectItem>
                  {filterableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'} 
              size="icon" 
              onClick={() => setViewMode('grid')}
            >
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
              </div>
              <span className="sr-only">Grid view</span>
            </Button>
            
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <div className="flex flex-col justify-center items-center gap-0.5">
                <div className="w-3.5 h-0.5 bg-current rounded-sm"></div>
                <div className="w-3.5 h-0.5 bg-current rounded-sm"></div>
                <div className="w-3.5 h-0.5 bg-current rounded-sm"></div>
              </div>
              <span className="sr-only">List view</span>
            </Button>
          </div>
          
          {currentUser?.role === 'coordinator' && (
            <Button onClick={() => setShowCreateTask(true)} className="bg-violet-500 hover:bg-violet-600">
              <Plus size={16} className="mr-1" /> New Task
            </Button>
          )}
        </div>
      </div>
      
      {projects.map(project => (
        <ProjectColumn 
          key={project.id} 
          project={project} 
          tasks={getTasksForProject(project.id)}
          viewMode={viewMode}
        />
      ))}
      
      {/* Create Task Dialog */}
      {currentUser?.role === 'coordinator' && (
        <CreateTaskDialog 
          open={showCreateTask} 
          onOpenChange={setShowCreateTask} 
        />
      )}
    </div>
  );
};

export default ProjectBoard;
