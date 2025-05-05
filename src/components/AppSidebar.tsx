
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Sidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Calendar, Calendar as CalendarIcon, Kanban, Lock, Plus, User, Users } from 'lucide-react';
import UserManagement from './UserManagement';

export function AppSidebar() {
  const location = useLocation();
  const { currentUser, logout } = useAppContext();
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Only coordinators can manage users
  const canManageUsers = currentUser?.role === 'coordinator';

  return (
    <>
      <Sidebar defaultExpanded={true}>
        <Sidebar.Header>
          <div className="flex items-center space-x-2 px-2">
            <Kanban className="h-6 w-6" />
            <span className="text-lg font-semibold">Task Manager</span>
          </div>
        </Sidebar.Header>

        <Sidebar.Nav>
          <Sidebar.NavItem
            icon={<Kanban className="h-4 w-4" />}
            as={Link}
            to="/"
            active={location.pathname === '/'}
          >
            Task Board
          </Sidebar.NavItem>
          <Sidebar.NavItem
            icon={<Plus className="h-4 w-4" />}
            as={Link}
            to="/projects"
            active={location.pathname === '/projects'}
          >
            Projects
          </Sidebar.NavItem>
          <Sidebar.NavItem
            icon={<CalendarIcon className="h-4 w-4" />}
            as={Link}
            to="/in-progress"
            active={location.pathname === '/in-progress'}
          >
            In Progress
          </Sidebar.NavItem>
          <Sidebar.NavItem
            icon={<Calendar className="h-4 w-4" />}
            as={Link}
            to="/daily-activity"
            active={location.pathname === '/daily-activity'}
          >
            Daily Activity
          </Sidebar.NavItem>
          {canManageUsers && (
            <Sidebar.NavItem
              icon={<Users className="h-4 w-4" />}
              onClick={() => setShowUserManagement(true)}
              className="cursor-pointer"
            >
              User Management
            </Sidebar.NavItem>
          )}
        </Sidebar.Nav>

        <Sidebar.Footer>
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
        </Sidebar.Footer>
      </Sidebar>

      {/* User Management Dialog */}
      <UserManagement 
        open={showUserManagement} 
        onOpenChange={setShowUserManagement} 
      />
    </>
  );
}
