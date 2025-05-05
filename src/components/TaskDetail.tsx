
import { useState } from 'react';
import { Task, SubTask } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  CheckSquare,
  Plus,
  Save
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TaskDetailProps {
  task: Task;
  projectColor: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskDetail = ({ task, projectColor, open, onOpenChange }: TaskDetailProps) => {
  const { 
    currentUser, 
    getUserById, 
    getProjectById,
    updateTask,
    addSubtask,
    updateSubtask,
    addNote
  } = useAppContext();
  
  const [newNote, setNewNote] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [editingTask, setEditingTask] = useState<Task>({...task});
  
  const assignedUser = getUserById(task.assignedTo);
  const project = getProjectById(task.projectId);
  
  const canAddNote = currentUser?.role !== 'worker';
  const canAddSubtask = currentUser?.role === 'worker' || currentUser?.role === 'coordinator';
  const canEditTask = currentUser?.role === 'coordinator';
  
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    addNote(task.id, newNote);
    setNewNote('');
  };
  
  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    
    addSubtask(task.id, { 
      title: newSubtask, 
      status: 'not-started' 
    });
    setNewSubtask('');
  };
  
  const handleSubtaskStatusChange = (subtaskId: string, status: 'not-started' | 'in-progress' | 'completed') => {
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      updateSubtask(task.id, { ...subtask, status });
    }
  };
  
  const handleTaskUpdate = () => {
    updateTask(editingTask);
  };
  
  const handleTaskStatusChange = (status: string) => {
    setEditingTask(prev => ({
      ...prev,
      status: status as Task['status'],
      completedDate: status === 'completed' ? new Date() : undefined
    }));
  };
  
  const handlePriorityChange = (priority: string) => {
    setEditingTask(prev => ({
      ...prev,
      priority: priority as 'Alta' | 'Media' | 'Baja'
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: projectColor }}
            ></div>
            {project?.name} - {task.projectStage}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            {canEditTask && <TabsTrigger value="edit">Edit</TabsTrigger>}
          </TabsList>
          
          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 pt-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">{task.title}</h2>
              <p className="text-gray-700">{task.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[180px]">
                <label className="text-sm text-gray-500">Status</label>
                <div className="flex items-center mt-1">
                  <Badge className={`
                    text-white
                    ${task.status === 'not-started' ? 'bg-status-notStarted' : ''}
                    ${task.status === 'in-progress' ? 'bg-status-inProgress' : ''}
                    ${task.status === 'paused' ? 'bg-status-paused' : ''}
                    ${task.status === 'completed' ? 'bg-status-completed' : ''}
                  `}>
                    {task.status.replace(/-/g, ' ')}
                  </Badge>
                </div>
              </div>
              
              <div className="min-w-[180px]">
                <label className="text-sm text-gray-500">Assigned to</label>
                <div className="mt-1 font-medium">
                  {assignedUser?.name}
                </div>
              </div>
              
              {task.priority && (
                <div className="min-w-[180px]">
                  <label className="text-sm text-gray-500">Priority</label>
                  <div className="mt-1 font-medium">
                    {task.priority}
                  </div>
                </div>
              )}
              
              <div className="min-w-[180px]">
                <label className="text-sm text-gray-500">Progress</label>
                <div className="w-full mt-1">
                  <Progress
                    value={task.progress}
                    className="h-2"
                    indicatorClassName={task.status === 'completed' ? 'bg-status-completed' : 'bg-status-inProgress'}
                  />
                  <div className="text-sm mt-1">{task.progress}% complete</div>
                </div>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm text-gray-500 flex items-center">
                  <Calendar size={14} className="mr-1" /> Assigned Date
                </label>
                <div className="text-sm mt-1">
                  {format(new Date(task.assignedDate), 'MMM d, yyyy')}
                </div>
              </div>
              
              {task.dueDate && (
                <div>
                  <label className="text-sm text-gray-500 flex items-center">
                    <Clock size={14} className="mr-1" /> Due Date
                  </label>
                  <div className="text-sm mt-1">
                    {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </div>
                </div>
              )}
              
              {task.completedDate && (
                <div>
                  <label className="text-sm text-gray-500 flex items-center">
                    <CheckCircle2 size={14} className="mr-1" /> Completed Date
                  </label>
                  <div className="text-sm mt-1">
                    {format(new Date(task.completedDate), 'MMM d, yyyy')}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Subtasks Tab */}
          <TabsContent value="subtasks" className="space-y-4 pt-4">
            {task.subtasks.length > 0 ? (
              <div className="space-y-3">
                {task.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">{subtask.title}</div>
                    
                    {canAddSubtask && (
                      <Select 
                        value={subtask.status} 
                        onValueChange={(value) => handleSubtaskStatusChange(
                          subtask.id, 
                          value as SubTask['status']
                        )}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not-started">Not Started</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    {!canAddSubtask && (
                      <Badge className={`
                        text-white
                        ${subtask.status === 'not-started' ? 'bg-status-notStarted' : ''}
                        ${subtask.status === 'in-progress' ? 'bg-status-inProgress' : ''}
                        ${subtask.status === 'completed' ? 'bg-status-completed' : ''}
                      `}>
                        {subtask.status.replace(/-/g, ' ')}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No subtasks yet
              </div>
            )}
            
            {canAddSubtask && (
              <form onSubmit={handleSubtaskSubmit} className="flex gap-2">
                <Input 
                  placeholder="Add a subtask..." 
                  value={newSubtask} 
                  onChange={(e) => setNewSubtask(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  <Plus size={16} className="mr-1" /> Add
                </Button>
              </form>
            )}
          </TabsContent>
          
          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4 pt-4">
            {task.notes.length > 0 ? (
              <div className="space-y-3">
                {task.notes.map(note => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm">{note.content}</p>
                    <div className="text-xs text-gray-500 mt-2 flex justify-between">
                      <span>{note.author}</span>
                      <span>{format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No notes yet
              </div>
            )}
            
            {canAddNote && (
              <form onSubmit={handleNoteSubmit} className="space-y-2">
                <Textarea 
                  placeholder="Add a note..." 
                  value={newNote} 
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button type="submit" size="sm">
                  <Plus size={16} className="mr-1" /> Add Note
                </Button>
              </form>
            )}
          </TabsContent>
          
          {/* Edit Tab */}
          {canEditTask && (
            <TabsContent value="edit" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    value={editingTask.title} 
                    onChange={(e) => setEditingTask(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                    value={editingTask.description} 
                    onChange={(e) => setEditingTask(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select 
                      value={editingTask.status} 
                      onValueChange={handleTaskStatusChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Project Stage</label>
                    <Select 
                      value={editingTask.projectStage} 
                      onValueChange={(value) => setEditingTask(prev => ({ ...prev, projectStage: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {project?.stages.map(stage => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select 
                      value={editingTask.priority || 'Media'} 
                      onValueChange={handlePriorityChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Media">Media</SelectItem>
                        <SelectItem value="Baja">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={handleTaskUpdate}>
                  <Save size={16} className="mr-1" /> Save Changes
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetail;
