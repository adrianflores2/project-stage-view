
import { useEffect, useState } from 'react';
import ProjectBoard from '@/components/ProjectBoard';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

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
  
  // Handle manual data refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadInitialData();
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };
  
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
    
    // Create channels for each table we want to monitor
    const createChannels = () => {
      const channels = [];
      
      // Task channel - already existing but enhanced
      const taskChannel = supabase
        .channel('public:tasks')
        .on('postgres_changes', 
          { 
            event: '*',  // Listen for all events (INSERT, UPDATE, DELETE)
            schema: 'public', 
            table: 'tasks' 
          }, 
          (payload) => {
            console.log('Task change detected:', payload);
            // Reload data when task changes are detected
            loadInitialData();
          }
        )
        .subscribe();
      channels.push(taskChannel);
      
      // Subtask channel
      const subtaskChannel = supabase
        .channel('public:subtasks')
        .on('postgres_changes', 
          { 
            event: '*',
            schema: 'public', 
            table: 'subtasks' 
          }, 
          (payload) => {
            console.log('Subtask change detected:', payload);
            loadInitialData();
          }
        )
        .subscribe();
      channels.push(subtaskChannel);
      
      // Notes channel
      const notesChannel = supabase
        .channel('public:notes')
        .on('postgres_changes', 
          { 
            event: '*',
            schema: 'public', 
            table: 'notes' 
          }, 
          (payload) => {
            console.log('Note change detected:', payload);
            loadInitialData();
          }
        )
        .subscribe();
      channels.push(notesChannel);
      
      // Projects channel
      const projectsChannel = supabase
        .channel('public:projects')
        .on('postgres_changes', 
          { 
            event: '*',
            schema: 'public', 
            table: 'projects' 
          }, 
          (payload) => {
            console.log('Project change detected:', payload);
            loadInitialData();
          }
        )
        .subscribe();
      channels.push(projectsChannel);
      
      // Project stages channel
      const stagesChannel = supabase
        .channel('public:project_stages')
        .on('postgres_changes', 
          { 
            event: '*',
            schema: 'public', 
            table: 'project_stages' 
          }, 
          (payload) => {
            console.log('Project stage change detected:', payload);
            loadInitialData();
          }
        )
        .subscribe();
      channels.push(stagesChannel);
      
      return channels;
    };
    
    setupRealtime();
    const channels = createChannels();
    
    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [currentUser, loadInitialData]);
  
  return (
    <>
      {/* Remove the top refresh button and add floating button */}
      <ProjectBoard />
      
      {/* Floating refresh button in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          size="icon" 
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={handleRefresh} 
          disabled={isRefreshing}
        >
          <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
          <span className="sr-only">{isRefreshing ? "Refreshing..." : "Refresh data"}</span>
        </Button>
      </div>
    </>
  );
};

export default Index;
