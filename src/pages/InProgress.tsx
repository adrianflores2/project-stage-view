
import { useEffect } from 'react';
import InProgressTracker from '@/components/InProgressTracker';
import { useAppContext } from '@/context/AppContext';

const InProgress = () => {
  const { currentUser, loadInitialData } = useAppContext();
  
  // Ensure data is loaded
  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser, loadInitialData]);
  
  return <InProgressTracker />;
};

export default InProgress;
