
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
      // Enable realtime for multiple tables
      const tables = ['tasks', 'subtasks', 'projects', 'project_stages', 'notes', 'reports'];
      
      for (const tableName of tables) {
        await supabase.rpc('supabase_functions.enable_realtime', {
          table_name: tableName,
        });
      }
      
      console.log('Realtime subscriptions enabled for all required tables');
    };
    
    setupRealtime();
  }, [currentUser]);
  
  return <ProjectBoard />;
};

export default Index;
