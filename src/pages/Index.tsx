
import { useEffect, useState } from 'react';
import ProjectBoard from '@/components/ProjectBoard';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const { currentUser, loadInitialData, dataLoaded } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
      // Enable realtime for the tasks table
      await supabase.rpc('supabase_functions.enable_realtime', {
        table_name: 'tasks',
      });
    };
    
    setupRealtime();
  }, [currentUser]);

  // Handle report generation
  const handleGenerateReport = () => {
    navigate('/reports');
    toast({
      title: "Report Page",
      description: "Create your daily activity report here",
    });
  };
  
  return (
    <div>
      {(currentUser?.role === 'worker' || currentUser?.role === 'coordinator') && (
        <div className="flex justify-end p-4">
          <Button 
            onClick={handleGenerateReport} 
            className="flex items-center gap-2"
          >
            <FileText size={18} />
            Generate Report
          </Button>
        </div>
      )}
      <ProjectBoard />
    </div>
  );
};

export default Index;
