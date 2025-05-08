
import { useState } from 'react';
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
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Calendar, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Kanban, Lock, Plus, User, Users, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import UserManagement from './UserManagement';

export function AppSidebar() {
  const location = useLocation();
  const { currentUser, logout } = useAppContext();
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Admins and coordinators can manage users
  const canManageUsers = currentUser?.role === 'coordinator' || currentUser?.role === 'admin';

  return (
    <>
      <div className="flex h-screen">
        <Sidebar className="sidebar-glass">
          <SidebarHeader className="relative">
            <div className="flex items-center space-x-2 px-2">
              <Kanban className="h-6 w-6 text-white" />
              {!collapsed && <span className="text-lg font-semibold text-white">Task Manager</span>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 text-white hover:bg-sidebar-accent/50 hover:text-white"
              onClick={() => setCollapsed(!collapsed)}
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
                    {!collapsed && <span>Task Board</span>}
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
                    {!collapsed && <span>Projects</span>}
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
                    {!collapsed && <span>In Progress</span>}
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
                    {!collapsed && <span>Reports</span>}
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
                    {!collapsed && <span>Daily Activity</span>}
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
                    {!collapsed && <span>User Management</span>}
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
      </div>
    </>
  );
}
