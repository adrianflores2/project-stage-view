
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User, Filter, Plus, Kanban, Check, Trash } from 'lucide-react';
import CreateTaskDialog from './CreateTaskDialog';
import { Task } from '@/types';

const ProjectBoard = () => {
  const { currentUser, projects, users, getFilteredTasks, deleteProject } = useAppContext();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCompleted, setShowCompleted] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  
  // Determine which users can be filtered based on role
  let filterableUsers = [];
  if (currentUser?.role === 'coordinator' || currentUser?.role === 'supervisor') {
    filterableUsers = users.filter(user => user.role === 'worker');
  } else if (currentUser?.role === 'worker') {
    filterableUsers = [currentUser]; // Workers can only see their own tasks
  }
  
  // Get tasks based on filters
  const getTasksForProject = (projectId: string, includeCompleted: boolean) => {
    // For workers, always filter by their ID
    let tasks = [];
    if (currentUser?.role === 'worker') {
      tasks = getFilteredTasks(projectId, currentUser.id);
    } else {
      // For others, apply the selected user filter if any
      tasks = getFilteredTasks(projectId, selectedUserId);
    }
    
    // Filter completed tasks
    return includeCompleted
      ? tasks.filter(task => task.status === 'completed')
      : tasks.filter(task => task.status !== 'completed');
  };
  
  // Group projects with completed tasks
  const projectsWithCompletedTasks = projects.filter(project => {
    const completedTasks = getTasksForProject(project.id, true);
    return completedTasks.length > 0;
  });
  
  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
    setProjectToDelete(null);
  };
  
  const canDeleteProject = currentUser?.role === 'coordinator';
  
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
            <Button onClick={() => setShowCreateTask(true)} className="bg-accent hover:bg-accent/90">
              <Plus size={16} className="mr-1" /> New Task
            </Button>
          )}
        </div>
      </div>
      
      {/* Active Projects */}
      <div className="mb-8">
        {projects.map(project => (
          <ProjectColumn 
            key={project.id} 
            project={project} 
            tasks={getTasksForProject(project.id, false)}
            viewMode={viewMode}
            onDeleteProject={canDeleteProject ? () => setProjectToDelete(project.id) : undefined}
          />
        ))}
      </div>
      
      {/* Completed Tasks Section */}
      {projectsWithCompletedTasks.length > 0 && (
        <div className="mt-10 pt-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <Check className="text-status-completed mr-2" />
            <h2 className="text-xl font-semibold">Completed Tasks</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="ml-3"
            >
              {showCompleted ? "Hide" : "Show"}
            </Button>
          </div>
          
          {showCompleted && (
            <div className="space-y-6 mt-2">
              {projectsWithCompletedTasks.map(project => (
                <div key={`completed-${project.id}`} className="bg-gray-50/50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: project.color }}
                    ></span>
                    <h3 className="text-md font-medium">{project.name}</h3>
                  </div>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-1'}>
                    {getTasksForProject(project.id, true).map(task => (
                      <div 
                        key={task.id} 
                        className="bg-white border rounded-md p-3 flex items-center shadow-sm"
                        style={{ borderLeftColor: project.color, borderLeftWidth: '3px' }}
                      >
                        <Check className="text-status-completed mr-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-gray-500">
                            Completed: {task.completed_date 
                              ? new Date(task.completed_date).toLocaleDateString() 
                              : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Create Task Dialog */}
      {currentUser?.role === 'coordinator' && (
        <CreateTaskDialog 
          open={showCreateTask} 
          onOpenChange={setShowCreateTask} 
        />
      )}
      
      {/* Delete Project Confirmation */}
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This will remove all tasks and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => projectToDelete && handleDeleteProject(projectToDelete)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectBoard;
