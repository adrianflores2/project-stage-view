
import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, Calendar as CalendarIcon, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { Report, Project } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Reports = () => {
  const { reports, projects, getUserById, getProjectById } = useAppContext();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Sort reports by date (newest first)
  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [reports]);
  
  // Group reports by project
  const reportsByProject = useMemo(() => {
    const grouped: Record<string, Report[]> = {
      unassigned: []
    };
    
    sortedReports.forEach(report => {
      if (report.projectId) {
        if (!grouped[report.projectId]) {
          grouped[report.projectId] = [];
        }
        grouped[report.projectId].push(report);
      } else {
        grouped.unassigned.push(report);
      }
    });
    
    return grouped;
  }, [sortedReports]);
  
  // Filter reports based on selected project
  const filteredReports = useMemo(() => {
    if (projectFilter === "all") {
      return sortedReports;
    } else if (projectFilter === "unassigned") {
      return reportsByProject.unassigned || [];
    } else {
      return reportsByProject[projectFilter] || [];
    }
  }, [sortedReports, projectFilter, reportsByProject]);
  
  // Get project names for the dropdown
  const projectOptions = useMemo(() => {
    const projectIds = Object.keys(reportsByProject).filter(id => id !== "unassigned");
    return projectIds.map(id => {
      const project = getProjectById(id);
      return { id, name: project?.name || 'Unknown Project' };
    });
  }, [reportsByProject, getProjectById]);
  
  const renderReportCard = (report: Report) => {
    const user = getUserById(report.userId);
    const project = report.projectId ? getProjectById(report.projectId) : undefined;
    
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
          
          {project && (
            <div className="flex items-center mt-2 text-sm">
              <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
              <span className="font-medium" style={{color: project.color}}>{project.name}</span>
            </div>
          )}
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
  };
  
  const renderReportsTable = () => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Worker</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead>Subtasks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReports.map((report) => {
            const user = getUserById(report.userId);
            const project = report.projectId ? getProjectById(report.projectId) : undefined;
            
            return (
              <TableRow key={report.id}>
                <TableCell>{format(new Date(report.date), 'MMM d, yyyy')}</TableCell>
                <TableCell>{user?.name || report.userName}</TableCell>
                <TableCell>
                  {project ? (
                    <span style={{ color: project.color }}>{project.name}</span>
                  ) : (
                    <span className="text-gray-400">Not assigned</span>
                  )}
                </TableCell>
                <TableCell>{report.completedTasks.length}</TableCell>
                <TableCell>{report.completedSubtasks.length}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold flex items-center mb-4">
        <FileText className="mr-2" /> Worker Reports
      </h1>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex-1 w-full md:w-auto">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {projectOptions.map(project => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'cards' | 'table')}>
            <TabsList>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {filteredReports.length > 0 ? (
        viewMode === 'cards' ? (
          <div className="space-y-4">
            {filteredReports.map(renderReportCard)}
          </div>
        ) : (
          renderReportsTable()
        )
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
