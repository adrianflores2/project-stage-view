
import { useEffect, useState } from 'react';
import ProjectBoard from '@/components/ProjectBoard';
import { useAppContext } from '@/context/AppContext';
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
      loadInitialData(currentUser).finally(() => {
        setIsLoading(false);
      });
    }
  }, [currentUser, loadInitialData, dataLoaded, isLoading]);
  
  // Function to manually refresh data
  const handleRefresh = () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    toast({
      title: "Refreshing data",
      description: "Loading latest data from the server..."
    });
    
    loadInitialData(currentUser)
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
