
import { useState } from 'react';
import { Report } from '@/types';

export function useReportOperations(
  reports: Report[],
  setReportsList: React.Dispatch<React.SetStateAction<Report[]>>
) {
  // Refresh reports from database
  const refreshReports = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select('*, users!reports_user_id_fkey(name)')
        .order('date', { ascending: false });
        
      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }
      
      if (reportsData) {
        // Process reports data
        const processedReports = reportsData.map(report => ({
          id: report.id,
          title: report.title || `Report ${report.id}`,
          date: report.date,
          user_id: report.user_id,
          message: report.message,
          project_id: report.project_id,
          projectId: report.project_id,
          tasks: [],
          users: report.users
        }));
        
        setReportsList(processedReports);
      }
    } catch (error) {
      console.error('Error refreshing reports:', error);
    }
  };
  
  // Add report
  const addReport = async (report: Omit<Report, 'id'>, taskIds: string[]) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Insert report
      const { data: newReport, error: reportError } = await supabase
        .from('reports')
        .insert({
          title: report.title,
          user_id: report.user_id,
          date: report.date,
          message: report.message,
          project_id: report.project_id || report.projectId
        })
        .select()
        .single();
        
      if (reportError) {
        console.error('Error creating report:', reportError);
        throw new Error('Failed to create report');
      }
      
      // Add report tasks
      for (const taskId of taskIds) {
        const { error: taskError } = await supabase
          .from('report_tasks')
          .insert({
            report_id: newReport.id,
            task_id: taskId
          });
          
        if (taskError) {
          console.error('Error adding task to report:', taskError);
          // Optionally, you might want to handle this error more gracefully
        }
      }
      
      // Update state
      setReportsList(prevReports => [...prevReports, {
        ...report,
        id: newReport.id
      }]);
      
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  };
  
  // Generate report (placeholder implementation)
  const generateReport = async (taskId: string, message: string) => {
    console.log(`Generating report for task ${taskId} with message: ${message}`);
  };

  // Get reports (placeholder implementation)
  const getReports = () => {
    return reports;
  };
  
  return {
    addReport,
    generateReport,
    getReports
  };
}
