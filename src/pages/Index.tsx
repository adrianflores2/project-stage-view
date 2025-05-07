
import { useEffect } from 'react';
import ProjectBoard from '@/components/ProjectBoard';
import { useAppContext } from '@/context/AppContext';

const Index = () => {
  const { currentUser, loadInitialData, dataLoaded } = useAppContext();
  
  // Ensure data is loaded
  useEffect(() => {
    if (currentUser && !dataLoaded) {
      console.log("Loading initial data from Index page");
      loadInitialData();
    }
  }, [currentUser, loadInitialData, dataLoaded]);
  
  return <ProjectBoard />;
};

export default Index;
