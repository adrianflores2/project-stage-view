
import { useEffect, useState } from 'react';
import ProjectBoard from '@/components/ProjectBoard';
import { useAppContext } from '@/context/AppContext';

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
  
  return <ProjectBoard />;
};

export default Index;
