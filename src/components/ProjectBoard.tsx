
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import ProjectColumn from './ProjectColumn';
import { 
  CustomAlertDialog,
  CustomAlertDialogAction,
  CustomAlertDialogCancel,
  CustomAlertDialogContent,
  CustomAlertDialogDescription,
  CustomAlertDialogFooter,
  CustomAlertDialogHeader,
  CustomAlertDialogTitle,
} from "@/components/ui/custom-alert-dialog";
import CreateTaskDialog from './CreateTaskDialog';
import { Task, TaskStatus } from '@/types';
import ProjectHeader from './project/ProjectHeader';
import CompletedTasksSection from './project/CompletedTasksSection';
import { Loader2 } from 'lucide-react';
import { TaskFilterProvider, useTaskFilters } from '@/context/TaskFilterContext';

const ProjectBoardContent = () => {
  const { currentUser, projects, users, deleteProject, updateTask } = useAppContext();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { filterOptions, setFilterOptions, filteredTasks, resetFilters } = useTaskFilters();
  
  // Determine which users can be filtered based on role
  let filterableUsers = [];
  if (currentUser?.role === 'coordinator' || currentUser?.role === 'supervisor') {
    filterableUsers = users.filter(user => user.role === 'worker');
  } else if (currentUser?.role === 'worker') {
    filterableUsers = [currentUser]; // Workers can only see their own tasks
  }
  
  // Get tasks based on filters
  const getTasksForProject = (projectId: string, includeCompleted: boolean) => {
    // Get all filtered tasks for this project
    const projectTasks = filteredTasks.filter(task => {
      const taskProjectId = task.projectId || task.project_id;
      return taskProjectId === projectId;
    });
    
    // Further filter based on completion status
    return includeCompleted
      ? projectTasks.filter(task => task.status === 'completed')
      : projectTasks.filter(task => task.status !== 'completed');
  };
  
  // Sort projects by number
  const sortedProjects = [...projects].sort((a, b) => {
    const numberA = a.number || 0;
    const numberB = b.number || 0;
    return numberA - numberB;
  });
  
  // Determine projects visible to the current user
  let visibleProjects = sortedProjects;
  if (currentUser?.role === 'worker') {
    visibleProjects = sortedProjects.filter(project => {
      const activeTasks = getTasksForProject(project.id, false);
      const completedTasks = getTasksForProject(project.id, true);
      return activeTasks.length > 0 || completedTasks.length > 0;
    });
  }

  // Group projects with completed tasks
  const projectsWithCompletedTasks = visibleProjects.filter(project => {
    const completedTasks = getTasksForProject(project.id, true);
    return completedTasks.length > 0;
  });
  
  const handleDeleteProject = async (projectId: string) => {
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
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
  // Allow all users to create tasks
  const canCreateTask = !!currentUser; // Any logged-in user can create tasks
  
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
        projects={visibleProjects}
        filterOptions={filterOptions}
        onFilterChange={setFilterOptions}
      />
      
      {/* Active Projects */}
      <div className="mb-8">
        {visibleProjects.map(project => (
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
      <CustomAlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <CustomAlertDialogContent aria-describedby="delete-project-description">
          <CustomAlertDialogHeader>
            <CustomAlertDialogTitle>Delete Project</CustomAlertDialogTitle>
            <CustomAlertDialogDescription id="delete-project-description">
              Are you sure you want to delete this project? This will remove all tasks and cannot be undone.
            </CustomAlertDialogDescription>
          </CustomAlertDialogHeader>
          <CustomAlertDialogFooter>
            <CustomAlertDialogCancel disabled={isDeleting}>Cancel</CustomAlertDialogCancel>
            <CustomAlertDialogAction 
              onClick={() => projectToDelete && handleDeleteProject(projectToDelete)}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                'Delete'
              )}
            </CustomAlertDialogAction>
          </CustomAlertDialogFooter>
        </CustomAlertDialogContent>
      </CustomAlertDialog>
    </div>
  );
};

// Wrapper component that provides the TaskFilterContext
const ProjectBoard = () => {
  const { tasks } = useAppContext();
  
  return (
    <TaskFilterProvider tasks={tasks}>
      <ProjectBoardContent />
    </TaskFilterProvider>
  );
};

export default ProjectBoard;
