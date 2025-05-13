
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
      // Get the current max sort order
      const maxOrderProject = [...projects].sort((a, b) => 
        (b.sort_order || 0) - (a.sort_order || 0)
      )[0];
      const nextSortOrder = maxOrderProject ? (maxOrderProject.sort_order || 0) + 1 : 0;
      
      // Insert project in Supabase
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name: project.name,
          color: project.color,
          sort_order: nextSortOrder
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
        sort_order: nextSortOrder
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
          sort_order: updatedProject.sort_order
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

  return { addProject, updateProject, deleteProject, getProjectById };
}
