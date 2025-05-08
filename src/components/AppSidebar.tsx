import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Calendar, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Kanban, Lock, Plus, User, Users, FileText, Trash2 } from 'lucide-react';
import UserManagement from './UserManagement';
import { useToast } from "./ui/use-toast";

export function AppSidebar() {
  const location = useLocation();
  const { currentUser, logout, tasks, deleteTask } = useAppContext();
  const [showUserManagement, setShowUserManagement] = useState(false);
  const { state, setOpen } = useSidebar();
  const { toast } = useToast();
  
  const collapsed = state === 'collapsed';

  // Admins and coordinators can manage users
  const canManageUsers = currentUser?.role === 'coordinator' || currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin';

  const handleCleanupTasks = async () => {
    if (!isAdmin) return;
    
    // Find completed tasks older than 48 hours
    const now = new Date();
    const tasksToDelete = tasks.filter(task => {
      if (task.status !== 'completed' || !task.completedDate) return false;
      
      // Convert completedDate to Date object if it's a string
      const completedDate = task.completedDate instanceof Date 
        ? task.completedDate 
        : new Date(task.completedDate);
      
      // Calculate time difference in milliseconds
      const timeDiff = now.getTime() - completedDate.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      return hoursDiff >= 48;
    });
    
    if (tasksToDelete.length === 0) {
      toast({
        title: "No tasks to clean up",
        description: "There are no completed tasks older than 48 hours.",
      });
      return;
    }
    
    toast({
      title: "Cleaning up tasks",
      description: `Deleting ${tasksToDelete.length} completed tasks...`
    });
    
    // Delete each task
    try {
      for (const task of tasksToDelete) {
        await deleteTask(task.id);
      }
      
      toast({
        title: "Tasks deleted",
        description: `Successfully deleted ${tasksToDelete.length} completed tasks.`
      });
    } catch (error: any) {
      console.error("Error deleting tasks:", error);
      toast({
        title: "Error deleting tasks",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  const toggleSidebar = () => {
    setOpen(!collapsed);
  };

  return (
    <>
      <Sidebar className={`sidebar-glass ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <SidebarHeader className="relative">
          <div className="flex items-center space-x-2 px-2">
            <Kanban className="h-6 w-6 text-white" />
            {!collapsed && <span className="text-lg font-semibold text-white">Task Manager</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 collapse-icon-container ${collapsed ? 'right-0.5' : 'right-2'}`}
            onClick={toggleSidebar}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link to="/" className="w-full">
                <SidebarMenuButton
                  isActive={location.pathname === '/'}
                  tooltip="Task Board"
                  className="text-sidebar-foreground hover:text-white"
                >
                  <Kanban className="h-4 w-4" />
                  <span className={collapsed ? "menu-item-text" : ""}>Task Board</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link to="/projects" className="w-full">
                <SidebarMenuButton
                  isActive={location.pathname === '/projects'}
                  tooltip="Projects"
                  className="text-sidebar-foreground hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                  <span className={collapsed ? "menu-item-text" : ""}>Projects</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link to="/in-progress" className="w-full">
                <SidebarMenuButton
                  isActive={location.pathname === '/in-progress'}
                  tooltip="In Progress"
                  className="text-sidebar-foreground hover:text-white"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className={collapsed ? "menu-item-text" : ""}>In Progress</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link to="/reports" className="w-full">
                <SidebarMenuButton
                  isActive={location.pathname === '/reports'}
                  tooltip="Reports"
                  className="text-sidebar-foreground hover:text-white"
                >
                  <FileText className="h-4 w-4" />
                  <span className={collapsed ? "menu-item-text" : ""}>Reports</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link to="/daily-activity" className="w-full">
                <SidebarMenuButton
                  isActive={location.pathname === '/daily-activity'}
                  tooltip="Daily Activity"
                  className="text-sidebar-foreground hover:text-white"
                >
                  <Calendar className="h-4 w-4" />
                  <span className={collapsed ? "menu-item-text" : ""}>Daily Activity</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            {canManageUsers && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setShowUserManagement(true)}
                  tooltip="User Management"
                  className="text-sidebar-foreground hover:text-white"
                >
                  <Users className="h-4 w-4" />
                  <span className={collapsed ? "menu-item-text" : ""}>User Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleCleanupTasks}
                  tooltip="Cleanup Old Tasks"
                  className="text-sidebar-foreground hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className={collapsed ? "menu-item-text" : ""}>Cleanup Tasks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex flex-col gap-y-2 px-2">
            {currentUser && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-sidebar-accent p-2">
                <div className="flex items-center gap-2">
                  <User className="h-6 w-6 text-white" />
                  {!collapsed && (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-white">{currentUser.name}</p>
                      <p className="text-xs text-gray-300 capitalize">{currentUser.role}</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Logout"
                  className="text-gray-300 hover:text-white hover:bg-sidebar-accent/80"
                >
                  <Lock className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* User Management Dialog */}
      <UserManagement 
        open={showUserManagement} 
        onOpenChange={setShowUserManagement} 
      />
    </>
  );
}
