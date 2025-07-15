import { Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export function useNoteOperations(
  tasks: Task[],
  setTasksList: React.Dispatch<React.SetStateAction<Task[]>>,
  currentUser: any
) {
  const addNote = async (taskId: string, content: string) => {
    try {
      // Validate that task exists
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        toast.error("Task not found", {
          description: "Cannot add note to non-existent task"
        });
        return;
      }
      
      // Ensure current user exists
      if (!currentUser) {
        toast.error("User not found", {
          description: "You must be logged in to add notes"
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
      
      toast.success("Note added", {
        description: "Your note has been added"
      });
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note", {
        description: error.message
      });
    }
  };

  const updateNote = async (taskId: string, note: Note) => {
    try {
      // Ensure current user exists
      if (!currentUser) {
        toast.error("User not found", {
          description: "You must be logged in to update notes"
        });
        return;
      }

      // Update note content in Supabase
      const { error } = await supabase
        .from('notes')
        .update({ content: note.content })
        .eq('id', note.id);

      if (error) {
        console.error("Error updating note:", error);
        throw error;
      }

      // Update local state
      setTasksList(prev =>
        prev.map(task => {
          if (task.id === taskId) {
            const updatedNotes = task.notes.map(n =>
              n.id === note.id ? { ...n, content: note.content } : n
            );
            return { ...task, notes: updatedNotes };
          }
          return task;
        })
      );

      toast.success("Note updated", {
        description: "Your note has been updated"
      });
    } catch (error: any) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note", {
        description: error.message
      });
    }
  };

  const deleteNote = async (taskId: string, noteId: string) => {
    try {
      // Ensure current user exists
      if (!currentUser) {
        toast.error("User not found", {
          description: "You must be logged in to delete notes"
        });
        return;
      }

      // Delete note in Supabase
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error("Error deleting note:", error);
        throw error;
      }

      // Update local state
      setTasksList(prev =>
        prev.map(task => {
          if (task.id === taskId) {
            const updatedNotes = task.notes.filter(n => n.id !== noteId);
            return { ...task, notes: updatedNotes };
          }
          return task;
        })
      );

      toast.success("Note deleted", {
        description: "The note has been removed"
      });
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note", {
        description: error.message
      });
    }
  };
  
  return { addNote, updateNote, deleteNote };
}
