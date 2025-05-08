
import { useEffect, useState } from 'react';
import ProjectBoard from '@/components/ProjectBoard';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { currentUser, loadInitialData, dataLoaded } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  
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
    
    // Add additional listener to ensure data reload when new tasks are created
    const channel = supabase
      .channel('public:tasks')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'tasks' 
        }, 
        (payload) => {
          console.log('New task created, reloading data:', payload);
          // Reload data when new task is created to ensure UI is updated
          loadInitialData();
        }
      )
      .subscribe();
    
    setupRealtime();
    
    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, loadInitialData]);
  
  return <ProjectBoard />;
};

export default Index;
