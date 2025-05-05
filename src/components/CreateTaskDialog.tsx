
import { useState } from 'react';
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
  Check
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateTaskDialog = ({ open, onOpenChange }: CreateTaskDialogProps) => {
  const { projects, users, addTask, currentUser } = useAppContext();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectStage, setProjectStage] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  
  const selectedProject = projects.find(p => p.id === projectId);
  const workerUsers = users.filter(u => u.role === 'worker');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addTask({
      title,
      description,
      projectId,
      projectStage,
      assignedTo,
      status: 'not-started',
      subtasks: [],
      notes: [],
      dueDate
    });
    
    // Reset form and close dialog
    setTitle('');
    setDescription('');
    setProjectId('');
    setProjectStage('');
    setAssignedTo('');
    setDueDate(undefined);
    onOpenChange(false);
  };
  
  const isFormValid = title.trim() && projectId && projectStage && assignedTo;
  
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
              value={projectStage} 
              onValueChange={setProjectStage}
              disabled={!projectId} 
              required
            >
              <SelectTrigger id="stage">
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {selectedProject?.stages.map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="assignedTo" className="text-sm font-medium">Assign To</label>
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
                />
              </PopoverContent>
            </Popover>
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
