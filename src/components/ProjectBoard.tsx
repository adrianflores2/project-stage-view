
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import ProjectColumn from './ProjectColumn';
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
import CreateTaskDialog from './CreateTaskDialog';
import { Task, TaskStatus } from '@/types';
import ProjectHeader from './project/ProjectHeader';
import CompletedTasksSection from './project/CompletedTasksSection';

const ProjectBoard = () => {
  const { currentUser, projects, users, getFilteredTasks, deleteProject, updateTask } = useAppContext();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
  
  const handleMarkTaskUndone = async (task: Task) => {
    // Check if current user has permission to undo this task
    const canUndo = currentUser?.role === 'coordinator' || 
                   currentUser?.role === 'supervisor' || 
                   (currentUser?.role === 'worker' && (task.assignedTo === currentUser.id || task.assigned_to === currentUser.id));
    
    if (!canUndo) {
      console.error("User doesn't have permission to undo this task");
      return;
    }
    
    const updatedTask = { 
      ...task, 
      status: 'in-progress' as TaskStatus, // Explicitly cast to TaskStatus
      completedDate: undefined, 
      completed_date: undefined
    };
    
    console.log("Marking task as undone:", updatedTask);
    await updateTask(updatedTask);
  };
  
  const canDeleteProject = currentUser?.role === 'coordinator';
  const canCreateTask = currentUser?.role === 'coordinator';
  
  return (
    <div className="p-4">
      <ProjectHeader 
        selectedUserId={selectedUserId}
        onUserChange={setSelectedUserId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateTask={() => setShowCreateTask(true)}
        filterableUsers={filterableUsers}
        canCreateTask={canCreateTask}
      />
      
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
      <CompletedTasksSection 
        projectsWithCompletedTasks={projectsWithCompletedTasks}
        getCompletedTasksForProject={(projectId) => getTasksForProject(projectId, true)}
        viewMode={viewMode}
      />
      
      {/* Create Task Dialog */}
      {canCreateTask && (
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
