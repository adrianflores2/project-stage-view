
import { User, Task, Project } from '@/types';

// Mock Users with passwords
export const users: User[] = [
  { id: '1', name: 'John Worker', role: 'worker', email: 'john@example.com', password: 'password123' },
  { id: '2', name: 'Jane Coordinator', role: 'coordinator', email: 'jane@example.com', password: 'password123' },
  { id: '3', name: 'Mike Supervisor', role: 'supervisor', email: 'mike@example.com', password: 'password123' },
  { id: '4', name: 'Sarah Worker', role: 'worker', email: 'sarah@example.com', password: 'password123' },
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

// Mock Tasks - now with priority field
export const tasks: Task[] = [
  {
    id: '1',
    title: 'Create wireframes',
    description: 'Create wireframes for the new homepage design',
    assignedTo: '1', // John Worker
    projectId: '1', // Website Redesign
    projectStage: 'Design',
    status: 'in-progress',
    subtasks: [
      { id: '1-1', title: 'Research competitors', status: 'completed' },
      { id: '1-2', title: 'Draft mobile layout', status: 'in-progress' },
      { id: '1-3', title: 'Draft desktop layout', status: 'not-started' },
    ],
    notes: [
      { 
        id: '1-1', 
        content: 'Please focus on mobile-first approach', 
        author: 'Jane Coordinator', 
        createdAt: new Date('2025-04-28') 
      },
    ],
    assignedDate: new Date('2025-04-25'),
    dueDate: new Date('2025-05-10'),
    progress: 33, // 1 out of 3 subtasks completed
    priority: 'Alta'
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Add login and registration functionality',
    assignedTo: '4', // Sarah Worker
    projectId: '1', // Website Redesign
    projectStage: 'Development',
    status: 'not-started',
    subtasks: [],
    notes: [],
    assignedDate: new Date('2025-04-30'),
    dueDate: new Date('2025-05-15'),
    progress: 0,
    priority: 'Media'
  },
  {
    id: '3',
    title: 'Create app icon',
    description: 'Design an icon for the mobile app',
    assignedTo: '1', // John Worker
    projectId: '2', // Mobile App
    projectStage: 'UI Design',
    status: 'completed',
    subtasks: [
      { id: '3-1', title: 'Research icon trends', status: 'completed' },
      { id: '3-2', title: 'Create design alternatives', status: 'completed' },
      { id: '3-3', title: 'Get feedback', status: 'completed' },
      { id: '3-4', title: 'Finalize design', status: 'completed' },
    ],
    notes: [
      { 
        id: '3-1', 
        content: 'Icon looks great! Make sure to create versions for all required sizes', 
        author: 'Jane Coordinator', 
        createdAt: new Date('2025-04-20') 
      },
      { 
        id: '3-2', 
        content: 'Please double check against Android and iOS requirements', 
        author: 'Mike Supervisor', 
        createdAt: new Date('2025-04-22') 
      },
    ],
    assignedDate: new Date('2025-04-15'),
    dueDate: new Date('2025-04-25'),
    completedDate: new Date('2025-04-24'),
    progress: 100, // All subtasks completed
    priority: 'Baja'
  },
  {
    id: '4',
    title: 'Develop content strategy',
    description: 'Create a content strategy for the marketing campaign',
    assignedTo: '4', // Sarah Worker
    projectId: '3', // Marketing Campaign
    projectStage: 'Planning',
    status: 'paused',
    subtasks: [
      { id: '4-1', title: 'Identify target audience', status: 'completed' },
      { id: '4-2', title: 'Research keywords', status: 'in-progress' },
      { id: '4-3', title: 'Create content calendar', status: 'not-started' },
    ],
    notes: [
      { 
        id: '4-1', 
        content: 'Paused until we get more information from the client', 
        author: 'Jane Coordinator', 
        createdAt: new Date('2025-05-01') 
      },
    ],
    assignedDate: new Date('2025-04-28'),
    dueDate: new Date('2025-05-12'),
    progress: 33, // 1 out of 3 subtasks completed
    priority: 'Media'
  },
];

// Initialize without a current user - now we'll use the login system
export const currentUser = null;
