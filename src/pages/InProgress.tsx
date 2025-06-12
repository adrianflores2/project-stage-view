
import { useQuery } from '@tanstack/react-query';
import { fetchUserTasks } from '@/lib/fetchUserTasks';
import InProgressTracker from '@/components/InProgressTracker';
import { useAppContext } from '@/context/AppContext';

const InProgress = () => {
  const { currentUser } = useAppContext();

  useQuery({
    queryKey: ['tasks', currentUser?.id],
    queryFn: () => fetchUserTasks(currentUser?.id),
    enabled: !!currentUser
  });
  
  return <InProgressTracker />;
};

export default InProgress;
