
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAppContext } from '@/context/AppContext';
import { User, UserRole } from '@/types';
import { 
  Kanban, 
  Tag, 
  Clock, 
  Settings, 
  LogOut, 
  UserCircle2 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const AppSidebar = () => {
  const { currentUser } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Navigation based on user role
  const getNavigationItems = (role: UserRole) => {
    const baseItems = [
      {
        title: "Tasks",
        url: "/",
        icon: Kanban,
      },
    ];
    
    // Add role-specific items
    if (role === 'supervisor' || role === 'coordinator') {
      baseItems.push({
        title: "In Progress",
        url: "/in-progress",
        icon: Clock,
      });
    }
    
    if (role === 'coordinator') {
      baseItems.push({
        title: "Projects",
        url: "/projects",
        icon: Tag,
      });
    }
    
    return baseItems;
  };
  
  const navItems = currentUser ? getNavigationItems(currentUser.role) : [];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          <h1 className="font-bold text-lg">Task Manager</h1>
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    className={location.pathname === item.url ? 'bg-accent' : ''}
                    onClick={() => navigate(item.url)}
                  >
                    <item.icon size={18} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        {currentUser && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCircle2 className="h-8 w-8" />
              <div>
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
