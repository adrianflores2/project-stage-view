
import { Project } from '@/types';
import { Quotation } from '@/types/quotation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useProjectOperations(
  projects: Project[],
  setProjectsList: React.Dispatch<React.SetStateAction<Project[]>>,
  addQuotation?: (quotation: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>) => Promise<Quotation>,
  currentUser?: any
) {
  const { toast } = useToast();
  
  // Helper function to validate project number uniqueness
  const isProjectNumberUnique = (number: number, projectId?: string): boolean => {
    if (!number || number === 0) return true; // Consider 0 as not set
    
    return !projects.some(project => 
      project.number === number && 
      (!projectId || project.id !== projectId) // Exclude the current project when updating
    );
  };
  
  const addProject = async (project: Omit<Project, 'id'>) => {
    try {
      // Validate project number uniqueness
      if (project.number && project.number > 0 && !isProjectNumberUnique(project.number)) {
        toast({
          title: "Invalid project number",
          description: "This project number is already in use. Please choose another number.",
          variant: "destructive"
        });
        return;
      }
      
      // Insert project in Supabase
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name: project.name,
          color: project.color,
          number: project.number,
          client_name: project.client_name,
          client_address: project.client_address,
          description: project.description
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add stages for the project
      if (project.stages && project.stages.length > 0) {
        const stagesToInsert = project.stages.map((stage, index) => ({
          project_id: newProject.id,
          name: stage,
          display_order: index
        }));
        
        const { error: stagesError } = await supabase
          .from('project_stages')
          .insert(stagesToInsert);
          
        if (stagesError) throw stagesError;
      }
      
      // Add to state with stages
      const projectWithStages = {
        ...newProject,
        stages: project.stages || []
      };
      
      // Update state with sorted projects
      setProjectsList(prev => {
        const updatedList = [...prev, projectWithStages];
        return updatedList.sort((a, b) => (a.number || 0) - (b.number || 0));
      });
      
      // Create an associated quotation if addQuotation function is provided
      if (addQuotation && currentUser) {
        try {
          // Set delivery deadline to 15 days from now as default
          const deliveryDeadline = new Date();
          deliveryDeadline.setDate(deliveryDeadline.getDate() + 15);
          
          await addQuotation({
            project_id: newProject.id,
            requested_by: currentUser.id,
            status: 'En elaboración',
            delivery_deadline: deliveryDeadline
          });
          
          console.log("Created associated quotation for new project:", newProject.name);
        } catch (quotationError) {
          console.error("Error creating associated quotation:", quotationError);
          // Don't throw error here, as the project has been created successfully
        }
      }
      
      toast({
        title: "Project created",
        description: `Project "${project.name}" has been created.`
      });
      
      return projectWithStages;
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast({
        title: "Failed to create project",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateProject = async (updatedProject: Project) => {
    try {
      // Validate project number uniqueness
      if (updatedProject.number && updatedProject.number > 0 && 
          !isProjectNumberUnique(updatedProject.number, updatedProject.id)) {
        toast({
          title: "Invalid project number",
          description: "This project number is already in use. Please choose another number.",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Updating project:", updatedProject);
      
      // Update project in Supabase
      const { error } = await supabase
        .from('projects')
        .update({
          name: updatedProject.name,
          color: updatedProject.color,
          number: updatedProject.number,
          client_name: updatedProject.client_name,
          client_address: updatedProject.client_address,
          description: updatedProject.description
        })
        .eq('id', updatedProject.id);
        
      if (error) throw error;
      
      // FIX: Instead of deleting and recreating stages, update existing and add new stages
      if (updatedProject.stages) {
        // Get current stages for comparison
        const { data: currentStages, error: stagesError } = await supabase
          .from('project_stages')
          .select('id, name, display_order')
          .eq('project_id', updatedProject.id);
          
        if (stagesError) throw stagesError;
        
        // Map of current stage names to their IDs
        const currentStagesMap = new Map();
        if (currentStages) {
          currentStages.forEach(stage => {
            currentStagesMap.set(stage.name, stage.id);
          });
        }
        
        // Prepare stages to update or insert
        for (let i = 0; i < updatedProject.stages.length; i++) {
          const stageName = updatedProject.stages[i];
          
          if (currentStagesMap.has(stageName)) {
            // Update existing stage display order
            const stageId = currentStagesMap.get(stageName);
            await supabase
              .from('project_stages')
              .update({ display_order: i })
              .eq('id', stageId);
              
            // Remove from map to track which ones need to be deleted
            currentStagesMap.delete(stageName);
          } else {
            // Insert new stage
            await supabase
              .from('project_stages')
              .insert({
                project_id: updatedProject.id,
                name: stageName,
                display_order: i
              });
          }
        }
        
        // Delete stages that are no longer in the list, but only if there are no tasks using them
        for (const [stageName, stageId] of currentStagesMap.entries()) {
          // Check if any tasks are using this stage
          const { data: tasksUsingStage, error: checkError } = await supabase
            .from('tasks')
            .select('id')
            .eq('project_stage_id', stageId)
            .limit(1);
            
          if (checkError) throw checkError;
          
          // Only delete if no tasks are using this stage
          if (!tasksUsingStage || tasksUsingStage.length === 0) {
            await supabase
              .from('project_stages')
              .delete()
              .eq('id', stageId);
          } else {
            console.log(`Cannot delete stage ${stageName} (${stageId}) because tasks are still using it`);
          }
        }
      }
      
      // Update state with sorted projects
      setProjectsList(prev => {
        const updatedList = prev.map(project => 
          project.id === updatedProject.id ? updatedProject : project
        );
        return updatedList.sort((a, b) => (a.number || 0) - (b.number || 0));
      });
      
      toast({
        title: "Project updated",
        description: `Project "${updatedProject.name}" has been updated.`
      });
    } catch (error: any) {
      console.error("Error updating project:", error);
      toast({
        title: "Failed to update project",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const deleteProject = async (projectId: string) => {
    try {
      // Delete project in Supabase (cascade will delete project stages and tasks)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
        
      if (error) throw error;
      
      // Update local state
      setProjectsList(prev => prev.filter(project => project.id !== projectId));
      
      toast({
        title: "Project deleted",
        description: "The project has been removed successfully"
      });
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast({
        title: "Failed to delete project",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const getProjectById = (id: string) => {
    return projects.find(project => project.id === id);
  };

  return { addProject, updateProject, deleteProject, getProjectById };
}
