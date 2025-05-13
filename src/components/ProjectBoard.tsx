
import { useState, useRef } from 'react';
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
import { Task, TaskStatus, Project } from '@/types';
import ProjectHeader from './project/ProjectHeader';
import CompletedTasksSection from './project/CompletedTasksSection';
import { Loader2 } from 'lucide-react';

const ProjectBoard = () => {
  const { currentUser, projects, users, getFilteredTasks, deleteProject, updateTask, updateProject } = useAppContext();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>(undefined);
  const [selectedDueDateRange, setSelectedDueDateRange] = useState<string | undefined>(undefined);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectsOrder, setProjectsOrder] = useState<string[]>(() => projects.map(p => p.id));
  const draggedProjectRef = useRef<string | null>(null);
  
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
    
    // Apply priority filter if selected
    if (selectedPriority) {
      tasks = tasks.filter(task => task.priority === selectedPriority);
    }
    
    // Apply due date range filter if selected
    if (selectedDueDateRange) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dueDate = (task: Task) => new Date(task.dueDate || task.due_date || '');
      
      switch (selectedDueDateRange) {
        case 'today':
          tasks = tasks.filter(task => {
            const taskDueDate = dueDate(task);
            return taskDueDate.toDateString() === today.toDateString();
          });
          break;
        case 'this-week':
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
          tasks = tasks.filter(task => {
            const taskDueDate = dueDate(task);
            return taskDueDate >= today && taskDueDate <= endOfWeek;
          });
          break;
        case 'this-month':
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          tasks = tasks.filter(task => {
            const taskDueDate = dueDate(task);
            return taskDueDate >= today && taskDueDate <= endOfMonth;
          });
          break;
        case 'overdue':
          tasks = tasks.filter(task => {
            const taskDueDate = dueDate(task);
            return taskDueDate < today && task.status !== 'completed';
          });
          break;
      }
    }
    
    // Sort tasks by assignment date (newest first)
    tasks.sort((a, b) => {
      const dateA = new Date(a.assignedDate || a.assigned_date || '').getTime();
      const dateB = new Date(b.assignedDate || b.assigned_date || '').getTime();
      return dateB - dateA; // Sort descending (newest first)
    });
    
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
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      // Remove from projects order
      setProjectsOrder(prev => prev.filter(id => id !== projectId));
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
  
  // Project drag-and-drop handlers
  const onDragStart = (projectId: string) => {
    if (currentUser?.role !== 'coordinator') return;
    draggedProjectRef.current = projectId;
  };
  
  const onDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    if (currentUser?.role !== 'coordinator') return;
  };
  
  const onDrop = async (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    if (currentUser?.role !== 'coordinator' || !draggedProjectRef.current) return;
    
    const draggedId = draggedProjectRef.current;
    if (draggedId === targetProjectId) return;
    
    // Update order in state
    const newOrder = [...projectsOrder];
    const draggedIndex = newOrder.findIndex(id => id === draggedId);
    const targetIndex = newOrder.findIndex(id => id === targetProjectId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);
      setProjectsOrder(newOrder);
      
      // Update display_order in database for each project
      for (let i = 0; i < newOrder.length; i++) {
        const projectId = newOrder[i];
        const project = projects.find(p => p.id === projectId);
        if (project) {
          const updatedProject = { ...project, display_order: i };
          await updateProject(updatedProject);
        }
      }
    }
    
    draggedProjectRef.current = null;
  };
  
  // Get sorted projects
  const sortedProjects = [...projects].sort((a, b) => {
    const indexA = projectsOrder.indexOf(a.id);
    const indexB = projectsOrder.indexOf(b.id);
    return indexA - indexB;
  });
  
  const canDeleteProject = currentUser?.role === 'coordinator';
  const canCreateTask = currentUser?.role === 'coordinator';
  const canReorderProjects = currentUser?.role === 'coordinator';
  
  return (
    <div className="p-4">
      <ProjectHeader 
        selectedUserId={selectedUserId}
        onUserChange={setSelectedUserId}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        selectedDueDateRange={selectedDueDateRange}
        onDueDateRangeChange={setSelectedDueDateRange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateTask={() => setShowCreateTask(true)}
        filterableUsers={filterableUsers}
        canCreateTask={canCreateTask}
      />
      
      {/* Active Projects */}
      <div className="mb-8">
        {sortedProjects.map(project => (
          <div 
            key={project.id}
            draggable={canReorderProjects}
            onDragStart={() => onDragStart(project.id)}
            onDragOver={(e) => onDragOver(e, project.id)}
            onDrop={(e) => onDrop(e, project.id)}
            className={canReorderProjects ? "cursor-grab active:cursor-grabbing" : ""}
          >
            <ProjectColumn 
              project={project} 
              tasks={getTasksForProject(project.id, false)}
              viewMode={viewMode}
              onDeleteProject={canDeleteProject ? () => setProjectToDelete(project.id) : undefined}
            />
          </div>
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

export default ProjectBoard;
