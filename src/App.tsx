
import { Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { AppProvider } from '@/context/AppContext';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

// Pages
import Login from '@/pages/Login';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Projects from '@/pages/Projects';
import InProgress from '@/pages/InProgress';
import Reports from '@/pages/Reports';
import DailyActivity from '@/pages/DailyActivity';

// Import Toast
import { Toaster } from '@/components/ui/toaster';
import { useAppContext } from './context/AppContext';

// MainContent component that uses the AppContext
function MainContentWithAuth() {
  const { isAuthenticated } = useAppContext();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div id="main-content" className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/in-progress" element={<InProgress />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/daily-activity" element={<DailyActivity />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </SidebarProvider>
  );
}

// App component that doesn't directly use AppContext
function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="task-manager-theme">
      <AppProvider>
        <MainContentWithAuth />
        <Toaster />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
