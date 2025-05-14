import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CalendarIcon,
  Check,
  Users
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateTaskDialog = ({ open, onOpenChange }: CreateTaskDialogProps) => {
  const { projects, users, addTask, currentUser } = useAppContext();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectStageId, setProjectStageId] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [isMultipleAssignees, setIsMultipleAssignees] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  
  const selectedProject = projects.find(p => p.id === projectId);
  const workerUsers = users.filter(u => u.role === 'worker');
  
  // Get project stages based on selected project
  const [projectStages, setProjectStages] = useState<{ id: string, name: string }[]>([]);
  
  // Important: Removed projectStageId from dependencies to prevent infinite re-rendering
  useEffect(() => {
    if (projectId && selectedProject) {
      // Fetch project stages for the selected project from Supabase
      const fetchProjectStages = async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase
          .from('project_stages')
          .select('id, name')
          .eq('project_id', projectId)
          .order('display_order', { ascending: true });
          
        if (error) {
          console.error('Error fetching project stages:', error);
          toast({
            title: "Error",
            description: "Failed to load project stages",
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          setProjectStages(data);
          // Only reset projectStageId when changing projects
          // Not when the user has already selected a stage
          setProjectStageId('');
        } else {
          setProjectStages([]);
          setProjectStageId('');
        }
      };
      
      fetchProjectStages();
    } else {
      setProjectStages([]);
      setProjectStageId('');
    }
  }, [projectId, selectedProject, toast]); // Removed projectStageId from dependencies
  
  // Handle project stage change separately
  const handleProjectStageChange = (value: string) => {
    console.log("Selected project stage ID:", value);
    setProjectStageId(value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isMultipleAssignees) {
        // For multiple assignees, create a task for each selected user
        for (const userId of selectedUsers) {
          await addTask({
            title,
            description,
            projectId,
            project_id: projectId,
            project_stage_id: projectStageId, // Make sure this is the ID, not name
            projectStage: projectStages.find(stage => stage.id === projectStageId)?.name || '',
            assignedTo: userId,
            status: 'not-started',
            subtasks: [],
            notes: [],
            dueDate,
            priority
          });
        }
      } else {
        // For single assignee
        await addTask({
          title,
          description,
          projectId,
          project_id: projectId,
          project_stage_id: projectStageId, // Make sure this is the ID, not name
          projectStage: projectStages.find(stage => stage.id === projectStageId)?.name || '',
          assignedTo,
          status: 'not-started',
          subtasks: [],
          notes: [],
          dueDate,
          priority
        });
      }
      
      // Reset form and close dialog
      setTitle('');
      setDescription('');
      setProjectId('');
      setProjectStageId('');
      setAssignedTo('');
      setSelectedUsers([]);
      setIsMultipleAssignees(false);
      setDueDate(undefined);
      setPriority('Media');
      onOpenChange(false);
      
      toast({
        title: "Task created",
        description: "Your task has been created successfully"
      });
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Failed to create task",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };
  
  const isFormValid = title.trim() && projectId && projectStageId && 
    (isMultipleAssignees ? selectedUsers.length > 0 : !!assignedTo);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input 
              id="title"
              placeholder="Task title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea 
              id="description"
              placeholder="Task description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="project" className="text-sm font-medium">Project</label>
              <Select value={projectId} onValueChange={setProjectId} required>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="stage" className="text-sm font-medium">Project Stage</label>
              <Select 
                value={projectStageId} 
                onValueChange={handleProjectStageChange}
                disabled={!projectId || projectStages.length === 0} 
                required
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  {projectStages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="assignedTo" className="text-sm font-medium">Assign To</label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setIsMultipleAssignees(!isMultipleAssignees)}
                className="text-xs flex items-center"
              >
                <Users className="w-3 h-3 mr-1" />
                {isMultipleAssignees ? 'Single assignee' : 'Multiple assignees'}
              </Button>
            </div>
            
            {isMultipleAssignees ? (
              <div className="border rounded-md p-2 space-y-2">
                {workerUsers.map(user => (
                  <div key={user.id} className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={`user-${user.id}`} 
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="mr-2"
                    />
                    <label htmlFor={`user-${user.id}`}>{user.name}</label>
                  </div>
                ))}
                {currentUser && currentUser.role === 'coordinator' && (
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={`user-${currentUser.id}`} 
                      checked={selectedUsers.includes(currentUser.id)}
                      onChange={() => toggleUserSelection(currentUser.id)}
                      className="mr-2"
                    />
                    <label htmlFor={`user-${currentUser.id}`}>{currentUser.name} (me)</label>
                  </div>
                )}
              </div>
            ) : (
              <Select value={assignedTo} onValueChange={setAssignedTo} required>
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {/* Coordinator can assign to self */}
                  {currentUser && currentUser.role === 'coordinator' && (
                    <SelectItem value={currentUser.id}>
                      {currentUser.name} (me)
                    </SelectItem>
                  )}
                  
                  {/* Or to any worker */}
                  {workerUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="dueDate" className="text-sm font-medium">Due Date (Optional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dueDate"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={!isFormValid}>
              <Check className="mr-2 h-4 w-4" /> Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
