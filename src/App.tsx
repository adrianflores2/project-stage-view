
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import InProgress from "./pages/InProgress";
import Reports from "./pages/Reports";
import DailyActivity from "./pages/DailyActivity";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAppContext();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Layout component that includes the sidebar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <Index />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute>
          <AppLayout>
            <Projects />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/in-progress" element={
        <ProtectedRoute>
          <AppLayout>
            <InProgress />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <AppLayout>
            <Reports />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/daily-activity" element={
        <ProtectedRoute>
          <AppLayout>
            <DailyActivity />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
