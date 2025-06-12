
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUserTasks } from '@/lib/fetchUserTasks';
import ProjectBoard from '@/components/ProjectBoard';
import { useAppContext } from '@/context/AppContext';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const { currentUser, loadInitialData } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { refetch } = useQuery({
    queryKey: ['tasks', currentUser?.id],
    queryFn: () => fetchUserTasks(currentUser?.id),
    enabled: !!currentUser
  });
  
  // Function to manually refresh data
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    toast({
      title: "Actualizando datos",
      description: "Cargando la información más reciente del servidor..."
    });
    
    try {
      // Use loadInitialData to refresh all application data
      await loadInitialData(currentUser);
      
      // Also refresh the query cache
      await refetch();
      
      toast({
        title: "Datos actualizados",
        description: "La información más reciente se ha cargado correctamente"
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error al actualizar",
        description: "No se pudo cargar la información más reciente. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
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
