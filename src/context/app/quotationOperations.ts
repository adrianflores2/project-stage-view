
import { Quotation, QuotationItem, Provider } from '@/types/quotation';
import { Task, SubTask } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useQuotationOperations(
  providers: Provider[],
  quotations: Quotation[],
  quotationItems: QuotationItem[],
  setQuotationsList: React.Dispatch<React.SetStateAction<Quotation[]>>,
  setQuotationItemsList: React.Dispatch<React.SetStateAction<QuotationItem[]>>,
  addTask: (task: Omit<Task, 'id' | 'assignedDate' | 'progress'>) => Promise<Task[]>,
  addSubtask: (taskId: string, subtask: Omit<SubTask, 'id'>) => Promise<void>,
  currentUser: any
) {
  const { toast } = useToast();
  
  const getQuotationsByProjectId = (projectId: string): Quotation[] => {
    return quotations.filter(quotation => quotation.project_id === projectId);
  };
  
  const getQuotationItemsByQuotationId = (quotationId: string): QuotationItem[] => {
    return quotationItems.filter(item => item.quotation_id === quotationId);
  };
  
  const getProviders = (): Provider[] => {
    return [...providers];
  };
  
  const addQuotation = async (quotation: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>): Promise<Quotation> => {
    try {
      // Insert quotation in Supabase
      const { data: newQuotation, error } = await supabase
        .from('quotations_test')
        .insert({
          project_id: quotation.project_id,
          requested_by: quotation.requested_by || currentUser?.id,
          status: quotation.status || 'En elaboración',
          delivery_deadline: quotation.delivery_deadline.toISOString().split('T')[0]
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Create a full quotation object
      const fullQuotation: Quotation = {
        ...newQuotation,
        delivery_deadline: new Date(newQuotation.delivery_deadline),
        created_at: new Date(newQuotation.created_at),
        updated_at: new Date(newQuotation.updated_at),
        items: []
      };
      
      // Update state
      setQuotationsList(prev => [...prev, fullQuotation]);
      
      toast({
        title: "Quotation created",
        description: `Quotation for project has been created`
      });
      
      return fullQuotation;
    } catch (error: any) {
      console.error("Error creating quotation:", error);
      toast({
        title: "Failed to create quotation",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const updateQuotation = async (updatedQuotation: Quotation): Promise<void> => {
    try {
      // Update quotation in Supabase
      const { error } = await supabase
        .from('quotations_test')
        .update({
          project_id: updatedQuotation.project_id,
          requested_by: updatedQuotation.requested_by,
          status: updatedQuotation.status,
          delivery_deadline: updatedQuotation.delivery_deadline.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedQuotation.id);
        
      if (error) throw error;
      
      // Update state
      setQuotationsList(prev => 
        prev.map(quotation => 
          quotation.id === updatedQuotation.id ? updatedQuotation : quotation
        )
      );
      
      toast({
        title: "Quotation updated",
        description: "Changes have been saved successfully"
      });
      
    } catch (error: any) {
      console.error("Error updating quotation:", error);
      toast({
        title: "Failed to update quotation",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const deleteQuotation = async (quotationId: string): Promise<void> => {
    try {
      // Delete all quotation items first
      const { error: itemsError } = await supabase
        .from('quotation_items_test')
        .delete()
        .eq('quotation_id', quotationId);
        
      if (itemsError) throw itemsError;
      
      // Then delete the quotation
      const { error } = await supabase
        .from('quotations_test')
        .delete()
        .eq('id', quotationId);
        
      if (error) throw error;
      
      // Update state
      setQuotationItemsList(prev => prev.filter(item => item.quotation_id !== quotationId));
      setQuotationsList(prev => prev.filter(quotation => quotation.id !== quotationId));
      
      toast({
        title: "Quotation deleted",
        description: "The quotation has been removed"
      });
      
    } catch (error: any) {
      console.error("Error deleting quotation:", error);
      toast({
        title: "Failed to delete quotation",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const addQuotationItem = async (item: Omit<QuotationItem, 'id' | 'created_at' | 'updated_at'>): Promise<QuotationItem> => {
    try {
      // Insert quotation item in Supabase
      const { data: newItem, error } = await supabase
        .from('quotation_items_test')
        .insert({
          quotation_id: item.quotation_id,
          equipment_name: item.equipment_name,
          ficha_estado: item.ficha_estado || 'Por hacer',
          ficha_responsable: item.ficha_responsable
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Create a full quotation item object
      const fullItem: QuotationItem = {
        ...newItem,
        created_at: new Date(newItem.created_at),
        updated_at: new Date(newItem.updated_at)
      };
      
      // Update state
      setQuotationItemsList(prev => [...prev, fullItem]);
      
      toast({
        title: "Quotation item added",
        description: `${item.equipment_name} has been added to the quotation`
      });
      
      return fullItem;
    } catch (error: any) {
      console.error("Error adding quotation item:", error);
      toast({
        title: "Failed to add quotation item",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const updateQuotationItem = async (updatedItem: QuotationItem): Promise<void> => {
    try {
      // Update quotation item in Supabase
      const { error } = await supabase
        .from('quotation_items_test')
        .update({
          quotation_id: updatedItem.quotation_id,
          equipment_name: updatedItem.equipment_name,
          ficha_estado: updatedItem.ficha_estado,
          ficha_responsable: updatedItem.ficha_responsable,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedItem.id);
        
      if (error) throw error;
      
      // Update state
      setQuotationItemsList(prev => 
        prev.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        )
      );
      
      toast({
        title: "Quotation item updated",
        description: "Changes have been saved successfully"
      });
      
    } catch (error: any) {
      console.error("Error updating quotation item:", error);
      toast({
        title: "Failed to update quotation item",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const deleteQuotationItem = async (itemId: string): Promise<void> => {
    try {
      // Delete the quotation item
      const { error } = await supabase
        .from('quotation_items_test')
        .delete()
        .eq('id', itemId);
        
      if (error) throw error;
      
      // Update state
      setQuotationItemsList(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: "Quotation item deleted",
        description: "The item has been removed"
      });
      
    } catch (error: any) {
      console.error("Error deleting quotation item:", error);
      toast({
        title: "Failed to delete quotation item",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  // Function to generate tasks from quotation items
  const generateQuotationTasks = async (quotationId: string): Promise<void> => {
    try {
      // Get the quotation
      const quotation = quotations.find(q => q.id === quotationId);
      if (!quotation) throw new Error("Quotation not found");
      
      // Get the associated project
      const project = quotation.project;
      if (!project) throw new Error("Project not found for this quotation");
      
      // Get quotation items
      const items = quotationItems.filter(item => item.quotation_id === quotationId);
      if (items.length === 0) {
        toast({
          title: "No items found",
          description: "This quotation has no items to generate tasks for",
          variant: "destructive"
        });
        return;
      }
      
      // Create a main quotation task - Fixed by adding the missing 'notes' property
      const mainTask = await addTask({
        title: `Quotation: ${project.name}`,
        description: `Main task for managing quotation items for project ${project.name}`,
        assignedTo: currentUser?.id,
        projectId: project.id,
        projectStage: 'Planning',
        status: 'in-progress',
        priority: 'Media',
        subtasks: [],
        notes: [] // Add the missing notes property
      });
      
      if (!mainTask || mainTask.length === 0) {
        throw new Error("Failed to create main quotation task");
      }
      
      const mainTaskId = mainTask[0].id;
      
      // Create subtasks for each quotation item
      for (const item of items) {
        await addSubtask(mainTaskId, {
          title: `Quote for: ${item.equipment_name}`,
          status: item.ficha_estado === 'Completado' ? 'completed' : 
                 item.ficha_estado === 'En proceso' ? 'in-progress' : 'not-started'
        });
      }
      
      toast({
        title: "Tasks generated",
        description: `Created quotation tasks for ${items.length} items`
      });
      
    } catch (error: any) {
      console.error("Error generating quotation tasks:", error);
      toast({
        title: "Failed to generate tasks",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  return {
    getQuotationsByProjectId,
    getQuotationItemsByQuotationId,
    getProviders,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    addQuotationItem,
    updateQuotationItem,
    deleteQuotationItem,
    generateQuotationTasks
  };
}
