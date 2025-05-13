
import { useEffect, useState } from 'react';
import ProjectBoard from '@/components/ProjectBoard';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import FloatingRefreshButton from '@/components/FloatingRefreshButton';

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
      <ProjectBoard />
      <FloatingRefreshButton />
    </>
  );
};

export default Index;
