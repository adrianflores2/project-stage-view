
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
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');
        
      if (usersError) throw usersError;
      setUsersList(usersData);
      
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
        
      if (projectsError) throw projectsError;
      
      // Load project stages for each project
      const projectsWithStages = await Promise.all(projectsData.map(async (project) => {
        const { data: stagesData, error: stagesError } = await supabase
          .from('project_stages')
          .select('*')
          .eq('project_id', project.id)
          .order('display_order', { ascending: true });
          
        if (stagesError) throw stagesError;
        
        return {
          ...project,
          stages: stagesData.map(stage => stage.name)
        };
      }));
      
      setProjectsList(projectsWithStages);
      
      // Load tasks with their subtasks and notes
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*');
        
      if (tasksError) throw tasksError;
      
      const tasksWithDetails = await Promise.all(tasksData.map(async (task) => {
        // Get subtasks
        const { data: subtasksData, error: subtasksError } = await supabase
          .from('subtasks')
          .select('*')
          .eq('task_id', task.id);
          
        if (subtasksError) throw subtasksError;
        
        // Get notes
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*, users!notes_author_id_fkey(name)')
          .eq('task_id', task.id);
          
        if (notesError) throw notesError;
        
        // Format notes with author name
        const formattedNotes = notesData.map(note => ({
          id: note.id,
          content: note.content,
          author: note.users?.name || 'Unknown',
          createdAt: note.created_at
        }));
        
        // Get project stage name
        let projectStage = "";
        if (task.project_stage_id) {
          const { data: stageData } = await supabase
            .from('project_stages')
            .select('name')
            .eq('id', task.project_stage_id)
            .single();
            
          if (stageData) {
            projectStage = stageData.name;
          }
        }
        
        const taskWithDetails: Task = {
          id: task.id,
          title: task.title,
          description: task.description || '',
          assignedTo: task.assigned_to || '',
          projectId: task.project_id || '',
          projectStage: projectStage,
          status: task.status,
          subtasks: subtasksData || [],
          notes: formattedNotes || [],
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
      }));
      
      setTasksList(tasksWithDetails);
      
      // Load reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*, users!reports_user_id_fkey(name)');
        
      if (reportsError) throw reportsError;
      
      const reportsWithDetails: Report[] = await Promise.all(reportsData.map(async (report) => {
        // Get report tasks
        const { data: reportTasksData } = await supabase
          .from('report_tasks')
          .select('tasks(*)')
          .eq('report_id', report.id);
          
        // Get report subtasks
        const { data: reportSubtasksData } = await supabase
          .from('report_subtasks')
          .select('subtasks(*)')
          .eq('report_id', report.id);
          
        // Format each task data
        const completedTasks: Task[] = reportTasksData?.map(rt => {
          // Fix: Access the tasks property of each item in reportTasksData
          const taskData = rt.tasks;
          return {
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
            // Keep original properties
            project_id: taskData.project_id,
            assigned_to: taskData.assigned_to,
            assigned_date: taskData.assigned_date,
            due_date: taskData.due_date,
            completed_date: taskData.completed_date
          };
        }) || [];
          
        // Format each subtask data
        const completedSubtasks: SubTask[] = reportSubtasksData?.map(rs => {
          // Fix: Access the subtasks property of each item in reportSubtasksData
          const subtaskData = rs.subtasks;
          return {
            id: subtaskData.id,
            title: subtaskData.title,
            status: subtaskData.status
          };
        }) || [];
          
        return {
          id: report.id,
          userId: report.user_id,
          userName: report.users?.name || 'Unknown',
          date: new Date(report.date),
          message: report.message || '',
          completedTasks,
          completedSubtasks
        };
      }));
      
      setReportsList(reportsWithDetails);
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
    }
  };

  return { loadInitialData };
}
