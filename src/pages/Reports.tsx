
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Report } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Reports = () => {
  const { reports, getUserById } = useAppContext();
  
  // Sort reports by date (newest first)
  const sortedReports = [...reports].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold flex items-center mb-6">
        <FileText className="mr-2" /> Worker Reports
      </h1>
      
      {sortedReports.length > 0 ? (
        <div className="space-y-4">
          {sortedReports.map((report) => {
            const user = getUserById(report.userId);
            
            return (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="pb-3 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-gray-700" /> 
                      <CardTitle className="text-lg">{user?.name || report.userName}</CardTitle>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {format(new Date(report.date), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  {report.message && (
                    <div className="mb-4 bg-blue-50 p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Worker Message:</p>
                      <p className="text-sm text-gray-700">{report.message}</p>
                    </div>
                  )}
                  
                  {report.completedTasks.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">Completed Tasks:</h3>
                      <ul className="space-y-2">
                        {report.completedTasks.map(task => (
                          <li key={task.id} className="bg-gray-50 p-2 rounded-md">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{task.title}</span>
                              <Badge variant="outline" className="bg-status-completed">completed</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{task.projectStage}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {report.completedSubtasks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Completed Subtasks:</h3>
                      <ul className="space-y-2">
                        {report.completedSubtasks.map(subtask => (
                          <li key={subtask.id} className="bg-gray-50 p-2 rounded-md">
                            <div className="flex justify-between">
                              <span className="text-sm">{subtask.title}</span>
                              <Badge variant="outline" className="bg-status-completed">completed</Badge>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {report.completedTasks.length === 0 && report.completedSubtasks.length === 0 && (
                    <Alert>
                      <AlertDescription className="text-center py-2">
                        No completed tasks or subtasks in this report
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Alert>
          <AlertDescription className="text-center py-8 text-gray-500">
            No reports available
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Reports;
