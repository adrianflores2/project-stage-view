
import { useEffect } from 'react';
import ProjectBoard from '@/components/ProjectBoard';
import { useAppContext } from '@/context/AppContext';

const Index = () => {
  const { currentUser, loadInitialData } = useAppContext();
  
  // Ensure data is loaded
  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser, loadInitialData]);
  
  return <ProjectBoard />;
};

export default Index;
