
import { Task, Report } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useReportOperations(
  tasks: Task[],
  reportsList: Report[],
  currentUser: any
) {
  const { toast } = useToast();
  
  const generateReport = async (title: string, description: string, selectedTasks: Task[]) => {
    try {
      if (!currentUser) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to generate reports",
          variant: "destructive"
        });
        return null;
      }
      
      // Create new report
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          title: title,
          description: description,
          created_by: currentUser.id,
          status: 'draft'
        })
        .select()
        .single();
        
      if (reportError) throw reportError;
      
      // Connect selected tasks to the report
      const reportTasksToInsert = selectedTasks.map(task => ({
        report_id: reportData.id,
        task_id: task.id
      }));
      
      const { error: linkError } = await supabase
        .from('report_tasks')
        .insert(reportTasksToInsert);
        
      if (linkError) throw linkError;
      
      // Create a report object
      const newReport: Report = {
        id: reportData.id,
        title: reportData.title,
        description: reportData.description,
        createdBy: reportData.created_by,
        created_by: reportData.created_by,
        createdAt: reportData.created_at,
        created_at: reportData.created_at,
        status: reportData.status,
        tasks: selectedTasks
      };
      
      toast({
        title: "Report generated",
        description: `Report "${title}" has been created successfully.`
      });
      
      return newReport;
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Failed to generate report",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };
  
  const getReports = () => {
    return reportsList;
  };
  
  return { generateReport, getReports };
}
