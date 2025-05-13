
import { User, Task, Project, SubTask, Note } from '@/types';

// Mock Users
export const users: User[] = [
  { id: '1', name: 'John Worker', role: 'worker', email: 'john@example.com' },
  { id: '2', name: 'Jane Coordinator', role: 'coordinator', email: 'jane@example.com' },
  { id: '3', name: 'Mike Supervisor', role: 'supervisor', email: 'mike@example.com' },
  { id: '4', name: 'Sarah Worker', role: 'worker', email: 'sarah@example.com' },
];

// Mock Projects
export const projects: Project[] = [
  { 
    id: '1', 
    name: 'Website Redesign', 
    stages: ['Planning', 'Design', 'Development', 'Testing', 'Deployment'], 
    color: '#3b82f6' // blue
  },
  { 
    id: '2', 
    name: 'Mobile App', 
    stages: ['Research', 'Wireframing', 'UI Design', 'Development', 'Testing', 'Launch'], 
    color: '#ef4444' // red
  },
  { 
    id: '3', 
    name: 'Marketing Campaign', 
    stages: ['Planning', 'Content Creation', 'Review', 'Execution', 'Analysis'], 
    color: '#22c55e' // green
  },
];

// Mock SubTasks
const createSubtask = (id: string, taskId: string, title: string, status: SubTask['status']): SubTask => ({
  id,
  task_id: taskId,
  title,
  status
});

// Mock Tasks
export const tasks: Task[] = [
  {
    id: '1',
    title: 'Create wireframes',
    description: 'Create wireframes for the new homepage design',
    assignedTo: '1', // John Worker
    assigned_to: '1',
    projectId: '1', // Website Redesign
    project_id: '1',
    projectStage: 'Design',
    project_stage_id: 'Design',
    status: 'in-progress',
    subtasks: [
      createSubtask('1-1', '1', 'Research competitors', 'completed'),
      createSubtask('1-2', '1', 'Draft mobile layout', 'in-progress'),
      createSubtask('1-3', '1', 'Draft desktop layout', 'not-started'),
    ],
    notes: [
      { 
        id: '1-1',
        task_id: '1',
        content: 'Please focus on mobile-first approach', 
        author: 'Jane Coordinator', 
        createdAt: new Date('2025-04-28').toISOString() 
      },
    ],
    assignedDate: new Date('2025-04-25').toISOString(),
    assigned_date: new Date('2025-04-25').toISOString(),
    dueDate: new Date('2025-05-10').toISOString(),
    due_date: new Date('2025-05-10').toISOString(),
    progress: 33, // 1 out of 3 subtasks completed
    priority: 'Alta'
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Add login and registration functionality',
    assignedTo: '4', // Sarah Worker
    assigned_to: '4',
    projectId: '1', // Website Redesign
    project_id: '1',
    projectStage: 'Development',
    project_stage_id: 'Development',
    status: 'not-started',
    subtasks: [],
    notes: [],
    assignedDate: new Date('2025-04-30').toISOString(),
    assigned_date: new Date('2025-04-30').toISOString(),
    dueDate: new Date('2025-05-15').toISOString(),
    due_date: new Date('2025-05-15').toISOString(),
    progress: 0,
    priority: 'Media'
  },
  {
    id: '3',
    title: 'Create app icon',
    description: 'Design an icon for the mobile app',
    assignedTo: '1', // John Worker
    assigned_to: '1',
    projectId: '2', // Mobile App
    project_id: '2',
    projectStage: 'UI Design',
    project_stage_id: 'UI Design',
    status: 'completed',
    subtasks: [
      createSubtask('3-1', '3', 'Research icon trends', 'completed'),
      createSubtask('3-2', '3', 'Create design alternatives', 'completed'),
      createSubtask('3-3', '3', 'Get feedback', 'completed'),
      createSubtask('3-4', '3', 'Finalize design', 'completed'),
    ],
    notes: [
      { 
        id: '3-1',
        task_id: '3',
        content: 'Icon looks great! Make sure to create versions for all required sizes', 
        author: 'Jane Coordinator', 
        createdAt: new Date('2025-04-20').toISOString() 
      },
      { 
        id: '3-2',
        task_id: '3',
        content: 'Please double check against Android and iOS requirements', 
        author: 'Mike Supervisor', 
        createdAt: new Date('2025-04-22').toISOString() 
      },
    ],
    assignedDate: new Date('2025-04-15').toISOString(),
    assigned_date: new Date('2025-04-15').toISOString(),
    dueDate: new Date('2025-04-25').toISOString(),
    due_date: new Date('2025-04-25').toISOString(),
    completedDate: new Date('2025-04-24').toISOString(),
    completed_date: new Date('2025-04-24').toISOString(),
    progress: 100, // All subtasks completed
    priority: 'Baja'
  },
  {
    id: '4',
    title: 'Develop content strategy',
    description: 'Create a content strategy for the marketing campaign',
    assignedTo: '4', // Sarah Worker
    assigned_to: '4',
    projectId: '3', // Marketing Campaign
    project_id: '3',
    projectStage: 'Planning',
    project_stage_id: 'Planning',
    status: 'paused',
    subtasks: [
      createSubtask('4-1', '4', 'Identify target audience', 'completed'),
      createSubtask('4-2', '4', 'Research keywords', 'in-progress'),
      createSubtask('4-3', '4', 'Create content calendar', 'not-started'),
    ],
    notes: [
      { 
        id: '4-1',
        task_id: '4',
        content: 'Paused until we get more information from the client', 
        author: 'Jane Coordinator', 
        createdAt: new Date('2025-05-01').toISOString() 
      },
    ],
    assignedDate: new Date('2025-04-28').toISOString(),
    assigned_date: new Date('2025-04-28').toISOString(),
    dueDate: new Date('2025-05-12').toISOString(),
    due_date: new Date('2025-05-12').toISOString(),
    progress: 33, // 1 out of 3 subtasks completed
    priority: 'Media'
  },
];

// Initialize without a current user - now we'll use the login system
export const currentUser = null;
