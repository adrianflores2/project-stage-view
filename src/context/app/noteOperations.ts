
import { Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useNoteOperations(
  tasks: Task[],
  setTasksList: React.Dispatch<React.SetStateAction<Task[]>>,
  currentUser: any
) {
  const { toast } = useToast();
  
  const addNote = async (taskId: string, content: string) => {
    try {
      // Validate that task exists
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        toast({
          title: "Task not found",
          description: "Cannot add note to non-existent task",
          variant: "destructive"
        });
        return;
      }
      
      // Ensure current user exists
      if (!currentUser) {
        toast({
          title: "User not found",
          description: "You must be logged in to add notes",
          variant: "destructive"
        });
        return;
      }

      // Insert note in Supabase
      const { data: newNote, error } = await supabase
        .from('notes')
        .insert({
          task_id: taskId,
          content: content,
          author_id: currentUser.id
        })
        .select('*, users!notes_author_id_fkey(name)')
        .single();
        
      if (error) {
        console.error("Error creating note:", error);
        throw error;
      }
      
      // Format the new note for the UI
      const formattedNote = {
        id: newNote.id,
        content: newNote.content,
        author: newNote.users?.name || currentUser.name || 'Unknown',
        createdAt: newNote.created_at
      };
      
      // Update local state immediately
      const updatedTasks = [...tasks];
      const task = updatedTasks[taskIndex];
      
      // Add the new note to the task
      const updatedTask = {
        ...task,
        notes: [...task.notes, formattedNote]
      };
      
      // Update the task in the list
      updatedTasks[taskIndex] = updatedTask;
      setTasksList(updatedTasks);
      
      toast({
        title: "Note added",
        description: "Your note has been added"
      });
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  return { addNote };
}
