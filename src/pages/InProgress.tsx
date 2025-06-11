
import { useEffect, useState } from 'react';
import InProgressTracker from '@/components/InProgressTracker';
import { useAppContext } from '@/context/AppContext';

const InProgress = () => {
  const { currentUser, loadInitialData, dataLoaded } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  
  // Ensure data is loaded just once
  useEffect(() => {
    if (currentUser && !dataLoaded && !isLoading) {
      console.log("Loading initial data from InProgress page");
      setIsLoading(true);
      loadInitialData(currentUser).finally(() => {
        setIsLoading(false);
      });
    }
  }, [currentUser, loadInitialData, dataLoaded, isLoading]);
  
  return <InProgressTracker />;
};

export default InProgress;
