
import { Report, Task, SubTask } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useReportOperations(
  tasks: Task[],
  reports: Report[],
  setReportsList: React.Dispatch<React.SetStateAction<Report[]>>,
  currentUser: any
) {
  const { toast } = useToast();
  
  const generateReport = async (taskId: string, message: string) => {
    if (!currentUser) return;
    
    try {
      // Check if the user already has a report for today
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of day for proper comparison
      
      const existingTodayReports = reports.filter(r => {
        const reportDate = new Date(r.date);
        reportDate.setHours(0, 0, 0, 0);
        return r.userId === currentUser.id && reportDate.getTime() === today.getTime();
      });

      // Delete existing reports for today from the same user
      if (existingTodayReports.length > 0) {
        for (const existingReport of existingTodayReports) {
          // Delete report_tasks links
          await supabase
            .from('report_tasks')
            .delete()
            .eq('report_id', existingReport.id);
          
          // Delete report_subtasks links
          await supabase
            .from('report_subtasks')
            .delete()
            .eq('report_id', existingReport.id);
          
          // Delete the report itself
          await supabase
            .from('reports')
            .delete()
            .eq('id', existingReport.id);
        }
        
        // Update local state to remove the deleted reports
        setReportsList(prev => prev.filter(r => {
          const reportDate = new Date(r.date);
          reportDate.setHours(0, 0, 0, 0);
          return !(r.userId === currentUser.id && reportDate.getTime() === today.getTime());
        }));
      }
      
      // Create new report in Supabase
      const { data: newReport, error } = await supabase
        .from('reports')
        .insert({
          user_id: currentUser.id,
          message: message,
          date: new Date()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Get all completed tasks for the current user from TODAY ONLY
      const todaysCompletedTasks = tasks.filter(t => 
        (t.assignedTo || t.assigned_to) === currentUser.id &&
        t.status === 'completed' &&
        (t.completedDate || t.completed_date) &&
        new Date((t.completedDate || t.completed_date)!).toDateString() === today.toDateString()
      );
      
      if (todaysCompletedTasks.length === 0) {
        toast({
          title: "No completed tasks",
          description: "You don't have any completed tasks for today to include in the report."
        });
      }
      
      // Add tasks to report_tasks
      if (todaysCompletedTasks.length > 0) {
        const taskLinks = todaysCompletedTasks.map(task => ({
          report_id: newReport.id,
          task_id: task.id
        }));
        
        await supabase
          .from('report_tasks')
          .insert(taskLinks);
      }
      
      // Get all subtasks completed today only
      const completedSubtasks: SubTask[] = [];
      tasks
        .filter(t => (t.assignedTo || t.assigned_to) === currentUser.id)
        .forEach(t => {
          // Filter subtasks to only include those completed today
          const completedToday = t.subtasks.filter(st => {
            if (st.status !== 'completed') return false;
            // Since SubTask doesn't have an updatedAt property in its type definition,
            // we can't filter based on completion date for subtasks
            // We'll include all completed subtasks instead
            return true;
          });
          completedSubtasks.push(...completedToday);
        });
      
      // Add subtasks to report_subtasks
      if (completedSubtasks.length > 0) {
        const subtaskLinks = completedSubtasks.map(subtask => ({
          report_id: newReport.id,
          subtask_id: subtask.id
        }));
        
        await supabase
          .from('report_subtasks')
          .insert(subtaskLinks);
      }
      
      // Format report for state
      const formattedReport: Report = {
        id: newReport.id,
        userId: currentUser.id,
        userName: currentUser.name,
        date: newReport.date,
        message: newReport.message,
        completedTasks: todaysCompletedTasks,
        completedSubtasks: completedSubtasks
      };
      
      setReportsList(prev => [...prev, formattedReport]);
      
      toast({
        title: "Report generated",
        description: "Your daily report has been submitted successfully."
      });
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Failed to generate report",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const getReports = () => {
    // Allow coordinators and supervisors to see all reports
    if (currentUser?.role === 'coordinator' || currentUser?.role === 'supervisor') {
      return reports;
    }
    // Workers can only see their own reports
    return reports.filter(report => report.userId === currentUser.id);
  };

  return { generateReport, getReports };
}
