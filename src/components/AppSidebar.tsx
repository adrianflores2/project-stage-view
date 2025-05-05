
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
  SidebarMenuButton
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Calendar, Calendar as CalendarIcon, Kanban, Lock, Plus, User, Users, FileReport } from 'lucide-react';
import UserManagement from './UserManagement';

export function AppSidebar() {
  const location = useLocation();
  const { currentUser, logout } = useAppContext();
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Only coordinators can manage users
  const canManageUsers = currentUser?.role === 'coordinator';

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center space-x-2 px-2">
            <Kanban className="h-6 w-6" />
            <span className="text-lg font-semibold">Task Manager</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link to="/" className="w-full">
                <SidebarMenuButton
                  isActive={location.pathname === '/'}
                  tooltip="Task Board"
                >
                  <Kanban className="h-4 w-4" />
                  <span>Task Board</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link to="/projects" className="w-full">
                <SidebarMenuButton
                  isActive={location.pathname === '/projects'}
                  tooltip="Projects"
                >
                  <Plus className="h-4 w-4" />
                  <span>Projects</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link to="/in-progress" className="w-full">
                <SidebarMenuButton
                  isActive={location.pathname === '/in-progress'}
                  tooltip="In Progress"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>In Progress</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link to="/reports" className="w-full">
                <SidebarMenuButton
                  isActive={location.pathname === '/reports'}
                  tooltip="Reports"
                >
                  <FileReport className="h-4 w-4" />
                  <span>Reports</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link to="/daily-activity" className="w-full">
                <SidebarMenuButton
                  isActive={location.pathname === '/daily-activity'}
                  tooltip="Daily Activity"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Daily Activity</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            {canManageUsers && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setShowUserManagement(true)}
                  tooltip="User Management"
                >
                  <Users className="h-4 w-4" />
                  <span>User Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex flex-col gap-y-2 px-2">
            {currentUser && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted p-2">
                <div className="flex items-center gap-2">
                  <User className="h-6 w-6" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Logout"
                >
                  <Lock className="h-5 w-5 text-muted-foreground" />
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
