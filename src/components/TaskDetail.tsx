import { useState } from 'react';
import { Task, SubTask, Note } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, differenceInDays } from 'date-fns';
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
  Save,
  FileText,
  Trash,
  Edit,
  UserPlus,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  HoverCard,
  HoverCardTrigger,
  HoverCardContent
} from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';

interface TaskDetailProps {
  task: Task;
  projectColor: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskDetail = ({ task, projectColor, open, onOpenChange }: TaskDetailProps) => {
  const { 
    currentUser, 
    users,
    getUserById, 
    getProjectById,
    updateTask,
    deleteTask,
    reassignTask,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    addNote,
    updateNote,
    deleteNote,
    generateReport
  } = useAppContext();
  
  const [newNote, setNewNote] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [editingTask, setEditingTask] = useState<Task>({...task});
  const [reportMessage, setReportMessage] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingSubtask, setIsDeletingSubtask] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  
  const assignedUser = getUserById(task.assignedTo || task.assigned_to || '');
  const project = getProjectById(task.projectId || task.project_id || '');
  
  // Modified: Allow worker role to add notes - CHANGED HERE
  const canAddNote = true; // All users can now add notes
  const canAddSubtask = currentUser?.role === 'worker' || currentUser?.role === 'coordinator';
  const canEditTask = currentUser?.role === 'coordinator';
  const canUpdateStatus = currentUser?.role === 'worker' || currentUser?.role === 'coordinator';
  const isAssignedToCurrentUser = currentUser?.id === (task.assignedTo || task.assigned_to);
  const canDeleteTask = currentUser?.role === 'coordinator';
  const canReassignTask = currentUser?.role === 'coordinator';
  const canDeleteSubtask = currentUser?.role === 'coordinator' || isAssignedToCurrentUser;
  const canModifyNote = (note: Note) => currentUser?.role === 'coordinator' || note.author === currentUser?.name;
  
  // Allow workers to generate report if they're assigned to this task
  const canGenerateReport = currentUser?.role === 'worker' && isAssignedToCurrentUser;
  
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    try {
      addNote(task.id, newNote);
      setNewNote('');
      toast({
        title: "Note added",
        description: "Your note has been added successfully.",
      });
    } catch (error) {
      console.error("Failed to add note:", error);
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    }
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
  
  // Modified to delete immediately without confirmation
  const handleSubtaskDelete = async (subtaskId: string) => {
    setIsDeletingSubtask(true);
    try {
      await deleteSubtask(task.id, subtaskId);
    } catch (error) {
      console.error("Error deleting subtask:", error);
    } finally {
      setIsDeletingSubtask(false);
    }
  };

  const startEditNote = (note: Note) => {
    setEditingNote(note);
    setEditingNoteText(note.content);
  };

  const handleUpdateNote = async () => {
    if (editingNote) {
      try {
        await updateNote(task.id, { ...editingNote, content: editingNoteText });
        setEditingNote(null);
        setEditingNoteText('');
      } catch (error) {
        console.error('Error updating note:', error);
      }
    }
  };

  const handleNoteDelete = async (noteId: string) => {
    setIsDeletingNote(true);
    try {
      await deleteNote(task.id, noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsDeletingNote(false);
    }
  };
  
  const handleTaskUpdate = () => {
    updateTask(editingTask);
  };
  
  const handleTaskStatusChange = (status: string) => {
    setEditingTask(prev => ({
      ...prev,
      status: status as Task['status'],
      completedDate: status === 'completed' ? new Date() : undefined,
      completed_date: status === 'completed' ? new Date() : undefined
    }));
  };
  
  const handlePriorityChange = (priority: string) => {
    setEditingTask(prev => ({
      ...prev,
      priority: priority as 'Alta' | 'Media' | 'Baja'
    }));
  };

  const handleGenerateReport = async () => {
    if (currentUser) {
      setIsGeneratingReport(true);
      await generateReport(reportMessage);
      setReportMessage('');
      setIsGeneratingReport(false);
    }
  };
  
  // Modified to delete task immediately without confirmation
  const handleDeleteTask = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      // Close dialog after successful deletion
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleReassignTask = async () => {
    if (newAssigneeId) {
      await reassignTask(task.id, newAssigneeId);
      setReassignDialogOpen(false);
      onOpenChange(false);
    }
  };
  
  // Calculate days remaining until due date
  const getDaysRemaining = () => {
    const dueDate = task.dueDate || task.due_date;
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    return differenceInDays(due, today);
  };
  
  const daysRemaining = getDaysRemaining();
  
  // Get worker users for reassignment
  const workerUsers = users.filter(u => u.role === 'worker' && u.id !== (task.assignedTo || task.assigned_to));
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-2xl flex flex-col" 
          style={{ 
            position: 'fixed',
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            maxHeight: '90vh',
            height: 'auto'
          }}
        >
          <DialogHeader className="sticky top-0 bg-white z-10 py-2 border-b">
            <DialogTitle className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: projectColor }}
              ></div>
              {project?.name} - {task.projectStage}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="flex-1 flex flex-col">
            <TabsList className="w-full sticky top-12 bg-white z-10">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              {(canEditTask || canUpdateStatus) && <TabsTrigger value="edit">Edit</TabsTrigger>}
              {canGenerateReport && <TabsTrigger value="report">Generate Report</TabsTrigger>}
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[calc(90vh-180px)] pr-4">
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
                        {canReassignTask && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
                            onClick={() => setReassignDialogOpen(true)}
                          >
                            <UserPlus size={12} />
                          </Button>
                        )}
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
                  
                  {(task.dueDate || task.due_date) && (
                    <div className="rounded-md border p-3">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm text-gray-500 flex items-center">
                          <Clock size={14} className="mr-1" /> Due Date: {format(new Date(task.dueDate || task.due_date!), 'MMM d, yyyy')}
                        </label>
                        <div className="text-sm font-medium">
                          {daysRemaining !== null ? (
                            daysRemaining > 0 ? 
                              `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining` : 
                              daysRemaining === 0 ? 
                                'Due today' : 
                                `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''}`
                          ) : ''}
                        </div>
                      </div>
                      
                      {daysRemaining !== null && (
                        <Progress 
                          value={Math.max(0, Math.min(100, (10 - Math.min(daysRemaining, 10)) * 10))}
                          className="h-2"
                          indicatorClassName={
                            daysRemaining > 3 ? 'bg-green-500' : 
                            daysRemaining >= 1 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }
                        />
                      )}
                    </div>
                  )}
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm text-gray-500 flex items-center">
                        <Calendar size={14} className="mr-1" /> Assigned Date
                      </label>
                      <div className="text-sm mt-1">
                        {format(new Date(task.assignedDate || task.assigned_date || new Date()), 'MMM d, yyyy')}
                      </div>
                    </div>
                    
                    {(task.completedDate || task.completed_date) && (
                      <div>
                        <label className="text-sm text-gray-500 flex items-center">
                          <CheckCircle2 size={14} className="mr-1" /> Completed Date
                        </label>
                        <div className="text-sm mt-1">
                          {format(new Date(task.completedDate || task.completed_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {canDeleteTask && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleDeleteTask}
                        className="flex items-center"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 size={16} className="mr-1 animate-spin" /> Deleting...
                          </>
                        ) : (
                          <>
                            <Trash size={16} className="mr-1" /> Delete Task
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                {/* Subtasks Tab */}
                <TabsContent value="subtasks" className="space-y-4 pt-4">
                  {task.subtasks.length > 0 ? (
                    <div className="space-y-3">
                      {task.subtasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex-1">{subtask.title}</div>
                          
                          <div className="flex items-center gap-2">
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
                            
                            {canDeleteSubtask && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSubtaskDelete(subtask.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={isDeletingSubtask}
                              >
                                {isDeletingSubtask ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash size={16} />
                                )}
                              </Button>
                            )}
                          </div>
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
                
                {/* Notes Tab with Hover Cards - Fixed */}
                <TabsContent value="notes" className="space-y-4 pt-4">
                  {task.notes.length > 0 ? (
                    <ScrollArea className="max-h-[400px] overflow-y-auto pr-4">
                      <div className="space-y-3">
                        {task.notes.map(note => (
                          <div key={note.id} className="relative">
                            <HoverCard openDelay={100} closeDelay={200}>
                              <HoverCardTrigger asChild>
                                <div className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
                                  <p className="text-sm line-clamp-2">{note.content}</p>
                                  <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                    <span>{note.author}</span>
                                    <span>{format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
                                  </div>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent side="right" align="start" className="w-80 p-4 shadow-lg border-gray-200 z-50">
                                <div className="space-y-2">
                                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                  <div className="text-xs text-gray-500 flex justify-between pt-2 border-t">
                                    <span>By: {note.author}</span>
                                    <span>{format(new Date(note.createdAt), 'MMM d, yyyy HH:mm')}</span>
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                            {canModifyNote(note) && (
                              <div className="absolute top-1 right-1 flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-blue-500 hover:bg-blue-50"
                                  onClick={() => startEditNote(note)}
                                >
                                  <Edit size={12} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-red-500 hover:bg-red-50"
                                  onClick={() => handleNoteDelete(note.id)}
                                  disabled={isDeletingNote}
                                >
                                  {isDeletingNote ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Trash size={12} />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
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
                
                {/* Edit Tab - Now available for workers to update task status */}
                {(canEditTask || canUpdateStatus) && (
                  <TabsContent value="edit" className="space-y-4 pt-4">
                    <div className="space-y-4">
                      {canEditTask && (
                        <>
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
                        </>
                      )}
                      
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
                        
                        {canEditTask && (
                          <>
                            <div>
                              <label className="text-sm font-medium">Project Stage</label>
                              <Select 
                                value={editingTask.projectStage} 
                                onValueChange={(value) => setEditingTask(prev => ({ ...prev, projectStage: value, project_stage_id: value }))}
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
                          </>
                        )}
                      </div>
                      
                      <Button onClick={handleTaskUpdate}>
                        <Save size={16} className="mr-1" /> Save Changes
                      </Button>
                    </div>
                  </TabsContent>
                )}
                
                {/* Report Generation Tab for Workers */}
                {canGenerateReport && (
                  <TabsContent value="report" className="space-y-4 pt-4">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Generate Task Report</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        This will generate a report of all completed tasks and subtasks for today. You can add an optional message.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Message (Optional)</label>
                          <Textarea
                            placeholder="Add any additional notes or context about your work today..."
                            value={reportMessage}
                            onChange={(e) => setReportMessage(e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                        
                        <Button onClick={handleGenerateReport} className="w-full" disabled={isGeneratingReport}>
                          {isGeneratingReport ? (
                            <Loader2 size={16} className="mr-1 animate-spin" />
                          ) : (
                            <FileText size={16} className="mr-1" />
                          )}
                          {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </ScrollArea>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
        <DialogContent className="max-w-md" style={{ position: 'fixed', top: '50%', transform: 'translateX(-50%) translateY(-50%)', left: '50%' }}>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <Textarea value={editingNoteText} onChange={(e) => setEditingNoteText(e.target.value)} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNote(null)}>Cancel</Button>
            <Button onClick={handleUpdateNote} disabled={!editingNoteText.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reassign Task Dialog */}
      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent className="max-w-md" style={{ position: 'fixed', top: '50%', transform: 'translateX(-50%) translateY(-50%)', left: '50%' }}>
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <label className="text-sm font-medium">Currently assigned to: {assignedUser?.name}</label>
            <Select value={newAssigneeId} onValueChange={setNewAssigneeId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select new assignee" />
              </SelectTrigger>
              <SelectContent>
                {workerUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReassignTask} disabled={!newAssigneeId}>Reassign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskDetail;
