
import { useState } from 'react';
import { Task, User, Note } from '@/types';
import { useToast } from '@/components/ui/use-toast';

export function useNoteOperations(
  tasks: Task[],
  setTasksList: React.Dispatch<React.SetStateAction<Task[]>>,
  currentUser: User | null
) {
  const { toast } = useToast();
  
  // Add a note to a task
  const addNote = async (taskId: string, content: string) => {
    if (!content.trim() || !taskId || !currentUser) {
      toast({
        title: "Error",
        description: "Cannot add empty note or missing task/user",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Create note in Supabase
      const { data: newNote, error } = await supabase
        .from('notes')
        .insert({
          content,
          task_id: taskId,
          author_id: currentUser.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Also get the author's name
      const { data: authorData } = await supabase
        .from('users')
        .select('name')
        .eq('id', currentUser.id)
        .single();
        
      // Update local state
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          // Format the note to match our Note type
          const formattedNote: Note = {
            id: newNote.id,
            task_id: taskId,
            content: newNote.content,
            author: authorData?.name || currentUser.name,
            createdAt: newNote.created_at || new Date().toISOString()
          };
          
          return {
            ...task,
            notes: [...task.notes, formattedNote]
          };
        }
        return task;
      });
      
      setTasksList(updatedTasks);
      
      toast({
        title: "Note added",
        description: "Your note has been added successfully"
      });
      
      return formattedNote;
      
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive" 
      });
      throw error;
    }
  };
  
  return { addNote };
}
