
import { useEffect, useState } from 'react';
import ProjectBoard from '@/components/ProjectBoard';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const { currentUser, loadInitialData, dataLoaded } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Ensure data is loaded just once
  useEffect(() => {
    if (currentUser && !dataLoaded && !isLoading) {
      console.log("Loading initial data from Index page");
      setIsLoading(true);
      loadInitialData().finally(() => {
        setIsLoading(false);
      });
    }
  }, [currentUser, loadInitialData, dataLoaded, isLoading]);
  
  // Setup realtime subscriptions for tables
  useEffect(() => {
    if (!currentUser) return;
    
    // Make sure we enable the realtime feature in Supabase
    const setupRealtime = async () => {
      try {
        // Enable realtime for multiple tables
        const tables = ['tasks', 'subtasks', 'projects', 'project_stages', 'notes', 'reports'];
        
        for (const tableName of tables) {
          await supabase.rpc('supabase_functions.enable_realtime', {
            table_name: tableName,
          });
        }
        
        console.log('Realtime subscriptions enabled for all required tables');
      } catch (error) {
        console.error('Error setting up realtime subscriptions:', error);
      }
    };
    
    // Create channels for each table type we want to listen to
    const taskChannel = supabase
      .channel('public:tasks')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' }, 
        (payload) => {
          console.log('Task change detected:', payload);
          // Reload data when task changes are detected
          loadInitialData();
        }
      )
      .subscribe();
      
    const subtaskChannel = supabase
      .channel('public:subtasks')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'subtasks' }, 
        (payload) => {
          console.log('Subtask change detected:', payload);
          loadInitialData();
        }
      )
      .subscribe();
      
    const projectChannel = supabase
      .channel('public:projects')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' }, 
        (payload) => {
          console.log('Project change detected:', payload);
          loadInitialData();
        }
      )
      .subscribe();
      
    const stageChannel = supabase
      .channel('public:project_stages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'project_stages' }, 
        (payload) => {
          console.log('Project stage change detected:', payload);
          loadInitialData();
        }
      )
      .subscribe();
      
    const noteChannel = supabase
      .channel('public:notes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notes' }, 
        (payload) => {
          console.log('Note change detected:', payload);
          loadInitialData();
        }
      )
      .subscribe();
    
    setupRealtime();
    
    // Cleanup function to remove all channels
    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(subtaskChannel);
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(stageChannel);
      supabase.removeChannel(noteChannel);
    };
  }, [currentUser, loadInitialData]);
  
  // Function to manually refresh data
  const handleRefresh = () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    toast({
      title: "Refreshing data",
      description: "Loading latest data from the server..."
    });
    
    loadInitialData()
      .then(() => {
        toast({
          title: "Data refreshed",
          description: "Latest data has been loaded successfully"
        });
      })
      .catch((error) => {
        console.error("Error refreshing data:", error);
        toast({
          title: "Refresh failed",
          description: "Could not load the latest data. Please try again.",
          variant: "destructive"
        });
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };
  
  return (
    <>
      <ProjectBoard />
      
      {/* Floating refresh button in the bottom right corner */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={handleRefresh}
          size="icon" 
          className="h-12 w-12 rounded-full shadow-lg"
          disabled={isRefreshing}
        >
          <RefreshCcw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </>
  );
};

export default Index;
