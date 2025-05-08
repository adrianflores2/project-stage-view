
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

function MainContent() {
  const { isAuthenticated } = useAppContext();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div id="main-content" className="main-content main-content-expanded">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/in-progress" element={<InProgress />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/daily-activity" element={<DailyActivity />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="task-manager-theme">
      <AppProvider>
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <AppSidebar />
            <MainContent />
          </div>
        </SidebarProvider>
        <Toaster />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
