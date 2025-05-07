
import { User, Task, Project, Report, SubTask } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { users as initialUsers, tasks as initialTasks, projects as initialProjects } from '@/data/mockData';

export function useDataLoading(
  setUsersList: React.Dispatch<React.SetStateAction<User[]>>,
  setTasksList: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjectsList: React.Dispatch<React.SetStateAction<Project[]>>,
  setReportsList: React.Dispatch<React.SetStateAction<Report[]>>,
  setDataLoaded: React.Dispatch<React.SetStateAction<boolean>>
) {
  const { toast } = useToast();
  
  const loadInitialData = async () => {
    try {
      // Load in parallel using Promise.all to improve performance
      const [
        usersResponse,
        projectsResponse,
        tasksResponse,
        reportsResponse
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('reports').select('*, users!reports_user_id_fkey(name)')
      ]);
      
      // Check for errors
      if (usersResponse.error) throw usersResponse.error;
      if (projectsResponse.error) throw projectsResponse.error;
      if (tasksResponse.error) throw tasksResponse.error;
      if (reportsResponse.error) throw reportsResponse.error;
      
      // Set users data
      setUsersList(usersResponse.data);
      
      // Process projects with their stages
      const projectsData = projectsResponse.data;
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
      const projectsWithStages = projectsData.map(project => ({
        ...project,
        stages: (stagesByProject[project.id] || []).map(stage => stage.name)
      }));
      
      setProjectsList(projectsWithStages);
      
      // Process tasks
      const tasksData = tasksResponse.data;
      const taskIds = tasksData.map(task => task.id);
      
      // Get all subtasks for all tasks at once
      const { data: allSubtasksData, error: subtasksError } = await supabase
        .from('subtasks')
        .select('*')
        .in('task_id', taskIds);
        
      if (subtasksError) throw subtasksError;
      
      // Get all notes for all tasks at once
      const { data: allNotesData, error: notesError } = await supabase
        .from('notes')
        .select('*, users!notes_author_id_fkey(name)')
        .in('task_id', taskIds);
        
      if (notesError) throw notesError;
      
      // Get all project stages
      const { data: allProjectStages, error: projectStagesError } = await supabase
        .from('project_stages')
        .select('*');
        
      if (projectStagesError) throw projectStagesError;
      
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
      
      allProjectStages.forEach(stage => {
        stagesById[stage.id] = stage.name;
      });
      
      // Combine tasks with their subtasks and notes
      const tasksWithDetails = tasksData.map(task => {
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
      });
      
      setTasksList(tasksWithDetails);
      
      // Process reports
      const reportsData = reportsResponse.data;
      const reportIds = reportsData.map(report => report.id);
      
      if (reportIds.length > 0) {
        // Get all report tasks for all reports at once
        const { data: allReportTasksData, error: reportTasksError } = await supabase
          .from('report_tasks')
          .select('*, tasks(*)')
          .in('report_id', reportIds);
          
        if (reportTasksError) throw reportTasksError;
        
        // Get all report subtasks for all reports at once
        const { data: allReportSubtasksData, error: reportSubtasksError } = await supabase
          .from('report_subtasks')
          .select('*, subtasks(*)')
          .in('report_id', reportIds);
          
        if (reportSubtasksError) throw reportSubtasksError;
        
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
        const reportsWithDetails: Report[] = reportsData.map(report => ({
          id: report.id,
          userId: report.user_id,
          userName: report.users?.name || 'Unknown',
          date: new Date(report.date),
          message: report.message || '',
          completedTasks: tasksByReport[report.id] || [],
          completedSubtasks: subtasksByReport[report.id] || []
        }));
        
        setReportsList(reportsWithDetails);
      } else {
        setReportsList([]);
      }
      
      setDataLoaded(true);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Data loading error",
        description: "Failed to load data from the database. Using demo data instead.",
        variant: "destructive"
      });
      
      // Fall back to mock data
      setUsersList(initialUsers);
      setTasksList(initialTasks);
      setProjectsList(initialProjects);
      setReportsList([]);
      setDataLoaded(true);
    }
  };

  return { loadInitialData };
}
