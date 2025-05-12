import { User, Task, Project, Report, SubTask } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Process users response
export async function processUsersResponse(usersData: any[]): Promise<User[]> {
  return usersData;
}

// Process projects response with their stages
export async function processProjectsResponse(projectsData: any[]): Promise<Project[]> {
  const projectIds = projectsData.map(project => project.id);
  
  // Get all stages for all projects at once
  const { data: allStagesData, error: stagesError } = await supabase
    .from('project_stages')
    .select('*')
    .in('project_id', projectIds)
    .order('display_order', { ascending: true });
    
  if (stagesError) throw stagesError;
  
  // Group stages by project_id
  const stagesByProject: Record<string, any[]> = {};
  allStagesData.forEach(stage => {
    if (!stagesByProject[stage.project_id]) {
      stagesByProject[stage.project_id] = [];
    }
    stagesByProject[stage.project_id].push(stage);
  });
  
  // Combine projects with their stages
  return projectsData.map(project => ({
    ...project,
    stages: (stagesByProject[project.id] || []).map(stage => stage.name)
  }));
}

// Process tasks response with their subtasks and notes
export async function processTasksResponse(tasksData: any[]): Promise<Task[]> {
  if (!tasksData || tasksData.length === 0) return [];
  
  const taskIds = tasksData.map(task => task.id);
  
  // Get all data in parallel for better performance
  const [subtasksResponse, notesResponse, stagesResponse] = await Promise.all([
    supabase.from('subtasks').select('*').in('task_id', taskIds),
    supabase.from('notes').select('*, users!notes_author_id_fkey(name)').in('task_id', taskIds),
    supabase.from('project_stages').select('*')
  ]);
  
  if (subtasksResponse.error) throw subtasksResponse.error;
  if (notesResponse.error) throw notesResponse.error;
  if (stagesResponse.error) throw stagesResponse.error;
  
  const allSubtasksData = subtasksResponse.data || [];
  const allNotesData = notesResponse.data || [];
  const allProjectStages = stagesResponse.data || [];
  
  // Group subtasks and notes by task_id
  const subtasksByTask: Record<string, any[]> = {};
  const notesByTask: Record<string, any[]> = {};
  const stagesById: Record<string, string> = {};
  
  allSubtasksData.forEach(subtask => {
    if (!subtasksByTask[subtask.task_id]) {
      subtasksByTask[subtask.task_id] = [];
    }
    subtasksByTask[subtask.task_id].push(subtask);
  });
  
  allNotesData.forEach(note => {
    if (!notesByTask[note.task_id]) {
      notesByTask[note.task_id] = [];
    }
    notesByTask[note.task_id].push({
      id: note.id,
      content: note.content,
      author: note.users?.name || 'Unknown',
      createdAt: note.created_at
    });
  });
  
  // Sort notes by creation date (newest first)
  Object.keys(notesByTask).forEach(taskId => {
    notesByTask[taskId].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });
  
  allProjectStages.forEach(stage => {
    stagesById[stage.id] = stage.name;
  });
  
  // Map tasks with their details
  return tasksData.map(task => {
    if (!task) return null;
    
    const taskWithDetails: Task = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      assignedTo: task.assigned_to || '',
      projectId: task.project_id || '',
      projectStage: task.project_stage_id ? stagesById[task.project_stage_id] || '' : '',
      status: task.status,
      subtasks: subtasksByTask[task.id] || [],
      notes: notesByTask[task.id] || [],
      assignedDate: task.assigned_date ? new Date(task.assigned_date) : new Date(),
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      completedDate: task.completed_date ? new Date(task.completed_date) : undefined,
      progress: task.progress || 0,
      priority: task.priority || 'Media',
      // Keep the original properties for compatibility with Supabase
      project_id: task.project_id,
      project_stage_id: task.project_stage_id,
      assigned_to: task.assigned_to,
      assigned_date: task.assigned_date,
      due_date: task.due_date,
      completed_date: task.completed_date
    };
    
    return taskWithDetails;
  }).filter(Boolean) as Task[]; // Filter out any null values
}

// Process reports response with their completed tasks and subtasks
export async function processReportsResponse(reportsData: any[]): Promise<Report[]> {
  if (!reportsData || reportsData.length === 0) return [];
  
  const reportIds = reportsData.map(report => report.id);
  
  // Skip if no reports
  if (reportIds.length === 0) return [];
  
  // Get all report tasks and subtasks in parallel
  const [reportTasksResponse, reportSubtasksResponse] = await Promise.all([
    supabase.from('report_tasks').select('*, tasks(*)').in('report_id', reportIds),
    supabase.from('report_subtasks').select('*, subtasks(*)').in('report_id', reportIds)
  ]);
  
  if (reportTasksResponse.error) throw reportTasksResponse.error;
  if (reportSubtasksResponse.error) throw reportSubtasksResponse.error;
  
  const allReportTasksData = reportTasksResponse.data || [];
  const allReportSubtasksData = reportSubtasksResponse.data || [];
  
  // Group report tasks and subtasks by report_id
  const tasksByReport: Record<string, any[]> = {};
  const subtasksByReport: Record<string, any[]> = {};
  
  allReportTasksData.forEach(reportTask => {
    if (!tasksByReport[reportTask.report_id]) {
      tasksByReport[reportTask.report_id] = [];
    }
    
    if (reportTask.tasks) {
      const taskData = reportTask.tasks;
      tasksByReport[reportTask.report_id].push({
        id: taskData.id,
        title: taskData.title,
        description: taskData.description || '',
        assignedTo: taskData.assigned_to || '',
        projectId: taskData.project_id || '',
        projectStage: '',
        status: taskData.status,
        subtasks: [],
        notes: [],
        assignedDate: taskData.assigned_date ? new Date(taskData.assigned_date) : new Date(),
        progress: taskData.progress || 0,
        completedDate: taskData.completed_date ? new Date(taskData.completed_date) : undefined,
        project_id: taskData.project_id,
        assigned_to: taskData.assigned_to,
        assigned_date: taskData.assigned_date,
        due_date: taskData.due_date,
        completed_date: taskData.completed_date
      });
    }
  });
  
  allReportSubtasksData.forEach(reportSubtask => {
    if (!subtasksByReport[reportSubtask.report_id]) {
      subtasksByReport[reportSubtask.report_id] = [];
    }
    
    if (reportSubtask.subtasks) {
      const subtaskData = reportSubtask.subtasks;
      subtasksByReport[reportSubtask.report_id].push({
        id: subtaskData.id,
        title: subtaskData.title,
        status: subtaskData.status
      });
    }
  });
  
  // Combine reports with their tasks and subtasks
  return reportsData.map(report => ({
    id: report.id,
    userId: report.user_id,
    userName: report.users?.name || 'Unknown',
    date: new Date(report.date),
    message: report.message || '',
    projectId: report.project_id || undefined, // Add projectId from the database
    completedTasks: tasksByReport[report.id] || [],
    completedSubtasks: subtasksByReport[report.id] || []
  }));
}
