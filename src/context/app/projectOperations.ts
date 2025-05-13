
import { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useProjectOperations(
  projects: Project[],
  setProjectsList: React.Dispatch<React.SetStateAction<Project[]>>
) {
  const { toast } = useToast();
  
  const addProject = async (project: Omit<Project, 'id'>) => {
    try {
      // Get the highest display_order value
      const highestOrder = Math.max(...projects.map(p => p.display_order || 0), 0);
      
      // Insert project in Supabase
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name: project.name,
          color: project.color,
          display_order: highestOrder + 1 // Set new project at the end
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
        stages: project.stages || [],
        display_order: highestOrder + 1
      };
      
      setProjectsList(prev => [...prev, projectWithStages]);
      
      toast({
        title: "Project created",
        description: `Project "${project.name}" has been created.`
      });
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
      // Update project in Supabase
      const { error } = await supabase
        .from('projects')
        .update({
          name: updatedProject.name,
          color: updatedProject.color,
          display_order: updatedProject.display_order || 0
        })
        .eq('id', updatedProject.id);
        
      if (error) throw error;
      
      // Update stages if changed
      if (updatedProject.stages) {
        // First delete existing stages
        await supabase
          .from('project_stages')
          .delete()
          .eq('project_id', updatedProject.id);
          
        // Add new stages
        const stagesToInsert = updatedProject.stages.map((stage, index) => ({
          project_id: updatedProject.id,
          name: stage,
          display_order: index
        }));
        
        if (stagesToInsert.length > 0) {
          const { error: stagesError } = await supabase
            .from('project_stages')
            .insert(stagesToInsert);
            
          if (stagesError) throw stagesError;
        }
      }
      
      setProjectsList(prev => 
        prev.map(project => project.id === updatedProject.id ? updatedProject : project)
      );
      
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
  
  const updateProjectOrder = async (projectId: string, direction: 'up' | 'down') => {
    try {
      // Find the project to move
      const projectIndex = projects.findIndex(p => p.id === projectId);
      if (projectIndex === -1) throw new Error("Project not found");
      
      // Create ordered list of projects
      const orderedProjects = [...projects].sort((a, b) => 
        (a.display_order || 0) - (b.display_order || 0)
      );
      
      // Find the index in the ordered list
      const orderedIndex = orderedProjects.findIndex(p => p.id === projectId);
      
      // Can't move first project up or last project down
      if ((direction === 'up' && orderedIndex === 0) || 
          (direction === 'down' && orderedIndex === orderedProjects.length - 1)) {
        return;
      }
      
      // Get the project to swap with
      const swapIndex = direction === 'up' ? orderedIndex - 1 : orderedIndex + 1;
      const projectToMove = orderedProjects[orderedIndex];
      const projectToSwap = orderedProjects[swapIndex];
      
      // Swap display orders
      const tempOrder = projectToMove.display_order || 0;
      projectToMove.display_order = projectToSwap.display_order || 0;
      projectToSwap.display_order = tempOrder;
      
      // Update both projects in database
      const updates = [
        supabase.from('projects')
          .update({ display_order: projectToMove.display_order })
          .eq('id', projectToMove.id),
          
        supabase.from('projects')
          .update({ display_order: projectToSwap.display_order })
          .eq('id', projectToSwap.id)
      ];
      
      await Promise.all(updates);
      
      // Update local state with new ordering
      setProjectsList([...orderedProjects]);
      
    } catch (error: any) {
      console.error("Error reordering projects:", error);
      toast({
        title: "Failed to reorder projects",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return { addProject, updateProject, deleteProject, getProjectById, updateProjectOrder };
}
