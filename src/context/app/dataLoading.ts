
import { User, Task, Project, Report, SubTask } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { users as initialUsers, tasks as initialTasks, projects as initialProjects } from '@/data/mockData';
import { 
  processUsersResponse,
  processProjectsResponse, 
  processTasksResponse, 
  processReportsResponse 
} from './dataLoadingUtils';

export function useDataLoading(
  setUsersList: React.Dispatch<React.SetStateAction<User[]>>,
  setTasksList: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjectsList: React.Dispatch<React.SetStateAction<Project[]>>,
  setReportsList: React.Dispatch<React.SetStateAction<Report[]>>,
  setDataLoaded: React.Dispatch<React.SetStateAction<boolean>>
) {
  const { toast } = useToast();
  
  const loadInitialData = async () => {
    try {
      // Load in parallel using Promise.all to improve performance
      const [
        usersResponse,
        projectsResponse,
        tasksResponse,
        reportsResponse
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('reports').select('*, users!reports_user_id_fkey(name)')
      ]);
      
      // Check for errors
      if (usersResponse.error) throw usersResponse.error;
      if (projectsResponse.error) throw projectsResponse.error;
      if (tasksResponse.error) throw tasksResponse.error;
      if (reportsResponse.error) throw reportsResponse.error;
      
      // Process responses in parallel for better performance
      const [users, projects, tasks, reports] = await Promise.all([
        processUsersResponse(usersResponse.data),
        processProjectsResponse(projectsResponse.data),
        processTasksResponse(tasksResponse.data),
        processReportsResponse(reportsResponse.data)
      ]);
      
      // Update state with processed data
      setUsersList(users);
      setProjectsList(projects);
      setTasksList(tasks);
      setReportsList(reports);
      setDataLoaded(true);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Data loading error",
        description: "Failed to load data from the database. Using demo data instead.",
        variant: "destructive"
      });
      
      // Fall back to mock data
      setUsersList(initialUsers);
      setTasksList(initialTasks);
      setProjectsList(initialProjects);
      setReportsList([]);
      setDataLoaded(true);
    }
  };

  return { loadInitialData };
}
