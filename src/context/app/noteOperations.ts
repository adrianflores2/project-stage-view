
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
    if (!currentUser) return;
    
    try {
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
        
      if (error) throw error;
      
      const formattedNote = {
        id: newNote.id,
        content: newNote.content,
        author: newNote.users?.name || currentUser.name,
        createdAt: newNote.created_at
      };
      
      setTasksList(prev => 
        prev.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              notes: [...task.notes, formattedNote]
            };
          }
          return task;
        })
      );
      
      toast({
        title: "Note added",
        description: "A new note has been added to the task."
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
