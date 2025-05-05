
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Project } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Tag, Edit, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const Projects = () => {
  const { projects, addProject, updateProject, currentUser } = useAppContext();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [newProject, setNewProject] = useState({
    name: '',
    stages: ['Planning'],
    color: '#3b82f6',
  });
  
  const [newStage, setNewStage] = useState('');
  
  const handleCreateProject = () => {
    if (newProject.name.trim()) {
      addProject(newProject);
      setNewProject({
        name: '',
        stages: ['Planning'],
        color: '#3b82f6',
      });
      setShowCreateProject(false);
    }
  };
  
  const handleUpdateProject = () => {
    if (editingProject && editingProject.name.trim()) {
      updateProject(editingProject);
      setEditingProject(null);
    }
  };
  
  const handleAddStage = (project: Project | null, stage: string) => {
    if (!stage.trim()) return;
    
    if (project) {
      // Adding to existing project
      const updatedProject = {
        ...project,
        stages: [...project.stages, stage]
      };
      setEditingProject(updatedProject);
    } else {
      // Adding to new project
      setNewProject({
        ...newProject,
        stages: [...newProject.stages, stage]
      });
    }
    setNewStage('');
  };
  
  const handleRemoveStage = (project: Project | null, stageToRemove: string) => {
    if (project) {
      // Removing from existing project
      const updatedProject = {
        ...project,
        stages: project.stages.filter(stage => stage !== stageToRemove)
      };
      setEditingProject(updatedProject);
    } else {
      // Removing from new project
      setNewProject({
        ...newProject,
        stages: newProject.stages.filter(stage => stage !== stageToRemove)
      });
    }
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Tag className="mr-2" /> Projects
        </h1>
        
        {currentUser?.role === 'coordinator' && (
          <Button onClick={() => setShowCreateProject(true)}>
            <Plus size={16} className="mr-1" /> New Project
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span 
                  className="w-4 h-4 rounded-full mr-2" 
                  style={{ backgroundColor: project.color }}
                ></span>
                {project.name}
              </CardTitle>
              <CardDescription>
                {project.stages.length} stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Stages:</h3>
                <div className="flex flex-wrap gap-1">
                  {project.stages.map(stage => (
                    <Badge key={stage} color={project.color}>
                      {stage}
                    </Badge>
                  ))}
                </div>
                
                {currentUser?.role === 'coordinator' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setEditingProject(project)}
                  >
                    <Edit size={14} className="mr-1" /> Edit Project
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Create Project Dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project Name</label>
              <Input 
                placeholder="Project name" 
                value={newProject.name} 
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Project Color</label>
              <Input 
                type="color" 
                value={newProject.color} 
                onChange={(e) => setNewProject({...newProject, color: e.target.value})}
                className="h-10 w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Project Stages</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {newProject.stages.map(stage => (
                  <Badge 
                    key={stage} 
                    color={newProject.color}
                    className="flex items-center gap-1"
                  >
                    {stage}
                    {newProject.stages.length > 1 && (
                      <button 
                        onClick={() => handleRemoveStage(null, stage)}
                        className="ml-1 hover:text-white/80"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Add new stage" 
                  value={newStage} 
                  onChange={(e) => setNewStage(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={() => handleAddStage(null, newStage)}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={handleCreateProject} disabled={!newProject.name.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          
          {editingProject && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <Input 
                  placeholder="Project name" 
                  value={editingProject.name} 
                  onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Project Color</label>
                <Input 
                  type="color" 
                  value={editingProject.color} 
                  onChange={(e) => setEditingProject({...editingProject, color: e.target.value})}
                  className="h-10 w-full"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Project Stages</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {editingProject.stages.map(stage => (
                    <Badge 
                      key={stage} 
                      color={editingProject.color}
                      className="flex items-center gap-1"
                    >
                      {stage}
                      {editingProject.stages.length > 1 && (
                        <button 
                          onClick={() => handleRemoveStage(editingProject, stage)}
                          className="ml-1 hover:text-white/80"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add new stage" 
                    value={newStage} 
                    onChange={(e) => setNewStage(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleAddStage(editingProject, newStage)}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={handleUpdateProject} disabled={!editingProject?.name.trim()}>
              <Save size={16} className="mr-1" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Badge component for project stages
const Badge = ({ children, color = '#3b82f6', className = '' }: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) => {
  return (
    <span 
      className={`px-2 py-1 rounded text-white text-xs flex items-center ${className}`}
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  );
};

export default Projects;
