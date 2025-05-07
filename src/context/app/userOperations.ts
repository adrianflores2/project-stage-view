
import { User, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useUserOperations(
  users: User[],
  tasks: Task[],
  setUsersList: React.Dispatch<React.SetStateAction<User[]>>
) {
  const { toast } = useToast();
  
  const getUserByName = (name: string) => {
    return users.find(user => user.name === name);
  };

  const getUserById = (id: string) => {
    return users.find(user => user.id === id);
  };
  
  const addUser = async (user: Omit<User, 'id'>) => {
    try {
      // Insert user in Supabase
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          name: user.name,
          email: user.email,
          role: user.role
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setUsersList(prev => [...prev, newUser]);
      
      toast({
        title: "User added",
        description: `User "${newUser.name}" has been successfully added.`
      });
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast({
        title: "Failed to add user",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const removeUser = async (userId: string) => {
    try {
      // Check if user has assigned tasks
      const userTasks = tasks.filter(task => (task.assignedTo || task.assigned_to) === userId);
      
      if (userTasks.length > 0) {
        toast({
          title: "Cannot remove user",
          description: "This user has assigned tasks. Please reassign them first.",
          variant: "destructive"
        });
        return;
      }
      
      // Delete user from Supabase
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsersList(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "User removed",
        description: "User has been successfully removed."
      });
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast({
        title: "Failed to remove user",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return { getUserByName, getUserById, addUser, removeUser };
}
