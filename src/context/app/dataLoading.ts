
import { useState } from 'react';
import { User, Task, Project, Report, SubTask } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { 
  processUsersResponse,
  processProjectsResponse, 
  processTasksResponse, 
  processReportsResponse 
} from './dataLoadingUtils';

export function useDataLoading(
  setUsersList: React.Dispatch<React.SetStateAction<User[]>>,
  setTasksList: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjectsList: React.Dispatch<React.SetStateAction<Project[]>>,
  setReportsList: React.Dispatch<React.SetStateAction<Report[]>>,
  setDataLoaded: React.Dispatch<React.SetStateAction<boolean>>
) {
  const loadInitialData = async () => {
    try {
      console.log("Starting to load initial data...");
      
      // Check if data is already loaded
      if (setDataLoaded) {
        const mockDataCheck = (prev: boolean) => {
          return prev;
        };
        // Check current value before setting
        setDataLoaded(prev => {
          if (prev) {
            console.log("Data already loaded, skipping load");
            return prev;
          }
          return false; // Keep it false until we load data
        });
      }
      
      // Load in parallel using Promise.all to improve performance
      const [
        usersResponse,
        projectsResponse,
        projectStagesResponse,
        tasksResponse,
        subtasksResponse,
        reportsResponse
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('project_stages').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('subtasks').select('*'),
        supabase.from('reports').select('*, users!reports_user_id_fkey(name)')
      ]);
      
      // Check for errors and log responses
      if (usersResponse.error) {
        console.error("Error fetching users:", usersResponse.error);
        throw usersResponse.error;
      }
      
      if (projectsResponse.error) {
        console.error("Error fetching projects:", projectsResponse.error);
        throw projectsResponse.error;
      }
      
      if (projectStagesResponse.error) {
        console.error("Error fetching project stages:", projectStagesResponse.error);
        throw projectStagesResponse.error;
      }
      
      if (tasksResponse.error) {
        console.error("Error fetching tasks:", tasksResponse.error);
        throw tasksResponse.error;
      }
      
      if (subtasksResponse.error) {
        console.error("Error fetching subtasks:", subtasksResponse.error);
        throw subtasksResponse.error;
      }
      
      if (reportsResponse.error) {
        console.error("Error fetching reports:", reportsResponse.error);
        throw reportsResponse.error;
      }
      
      console.log("Data fetched:", {
        users: usersResponse.data?.length,
        projects: projectsResponse.data?.length,
        projectStages: projectStagesResponse.data?.length,
        tasks: tasksResponse.data?.length,
        subtasks: subtasksResponse.data?.length
      });
      
      // Group project stages by project
      const projectStagesByProject: Record<string, string[]> = {};
      projectStagesResponse.data.forEach(stage => {
        if (stage.project_id) {
          if (!projectStagesByProject[stage.project_id]) {
            projectStagesByProject[stage.project_id] = [];
          }
          projectStagesByProject[stage.project_id].push(stage.name);
        }
      });
      
      // Add stages to projects
      const projectsWithStages = projectsResponse.data.map(project => ({
        ...project,
        stages: projectStagesByProject[project.id] || []
      }));
      
      // Add subtasks to tasks
      const taskIdToSubtasks: Record<string, SubTask[]> = {};
      subtasksResponse.data.forEach(subtask => {
        if (!taskIdToSubtasks[subtask.task_id]) {
          taskIdToSubtasks[subtask.task_id] = [];
        }
        taskIdToSubtasks[subtask.task_id].push(subtask);
      });
      
      const tasksWithSubtasks = tasksResponse.data.map(task => ({
        ...task,
        subtasks: taskIdToSubtasks[task.id] || []
      }));
      
      // Process responses in parallel for better performance
      const [users, projects, tasks, reports] = await Promise.all([
        processUsersResponse(usersResponse.data),
        processProjectsResponse(projectsWithStages),
        processTasksResponse(tasksWithSubtasks),
        processReportsResponse(reportsResponse.data)
      ]);
      
      console.log("Processed data:", {
        users: users.length,
        projects: projects.length,
        tasks: tasks.length
      });
      
      // Update state with processed data
      setUsersList(users);
      setProjectsList(projects);
      setTasksList(tasks);
      setReportsList(reports);
      setDataLoaded(true);
      
      toast.success("Data loaded successfully", {
        description: `Loaded ${users.length} users, ${projects.length} projects, and ${tasks.length} tasks`
      });
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Data loading error", {
        description: "Failed to load data from the database. Please try refreshing the page."
      });
      
      // Initialize with empty arrays instead of mock data
      setUsersList([]);
      setTasksList([]);
      setProjectsList([]);
      setReportsList([]);
      setDataLoaded(false); // Set to false so the app knows it needs to try loading again
    }
  };

  return { loadInitialData };
}
