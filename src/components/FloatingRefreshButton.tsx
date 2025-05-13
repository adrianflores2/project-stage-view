
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAppContext } from '@/context/AppContext';

const FloatingRefreshButton = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { loadInitialData } = useAppContext();
  
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
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="rounded-full shadow-lg h-12 w-12 p-0 bg-accent hover:bg-accent/80"
        aria-label="Refresh data"
      >
        <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
      </Button>
    </div>
  );
};

export default FloatingRefreshButton;
