
import { Project } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuotationPanel from '@/components/quotation/QuotationPanel';

interface ProjectDetailsProps {
  project: Project | null;
  isEditing: boolean;
  onProjectChange: (updatedProject: Partial<Project>) => void;
}

const ProjectDetails = ({ project, isEditing, onProjectChange }: ProjectDetailsProps) => {
  if (!project) return null;

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="details">Project Details</TabsTrigger>
        <TabsTrigger value="quotation">Quotations</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-4">
        {/* Project number */}
        <div className="space-y-2">
          <Label htmlFor="project-number">Project Number</Label>
          {isEditing ? (
            <Input
              id="project-number"
              type="number"
              value={project.number || 0}
              onChange={(e) => onProjectChange({ number: parseInt(e.target.value) || 0 })}
              min={0}
            />
          ) : (
            <div className="text-lg font-medium">
              {project.number !== undefined ? `#${project.number}` : 'No number assigned'}
            </div>
          )}
        </div>

        {/* Client name */}
        <div className="space-y-2">
          <Label htmlFor="client-name">Client Name</Label>
          {isEditing ? (
            <Input
              id="client-name"
              value={project.client_name || ''}
              onChange={(e) => onProjectChange({ client_name: e.target.value })}
              placeholder="Enter client name"
            />
          ) : (
            <div>{project.client_name || 'No client specified'}</div>
          )}
        </div>

        {/* Client address */}
        <div className="space-y-2">
          <Label htmlFor="client-address">Client Address</Label>
          {isEditing ? (
            <Textarea
              id="client-address"
              value={project.client_address || ''}
              onChange={(e) => onProjectChange({ client_address: e.target.value })}
              placeholder="Enter client address"
              rows={2}
            />
          ) : (
            <div className="whitespace-pre-wrap">{project.client_address || 'No address specified'}</div>
          )}
        </div>

        {/* Project description */}
        <div className="space-y-2">
          <Label htmlFor="project-description">Description</Label>
          {isEditing ? (
            <Textarea
              id="project-description"
              value={project.description || ''}
              onChange={(e) => onProjectChange({ description: e.target.value })}
              placeholder="Enter project description"
              rows={4}
            />
          ) : (
            <div className="whitespace-pre-wrap">{project.description || 'No description provided'}</div>
          )}
        </div>

        {/* Project stages */}
        <div className="space-y-2">
          <Label>Project Stages</Label>
          <div className="flex flex-wrap gap-2">
            {project.stages.map((stage, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                style={{ backgroundColor: project.color, color: 'white' }}
              >
                {stage}
              </Badge>
            ))}
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="quotation">
        <QuotationPanel project={project} />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectDetails;
