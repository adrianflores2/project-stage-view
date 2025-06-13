export function filterReportsByDate(reports, range) {
  if (!range.from || !range.to) return reports;
  const fromTime = new Date(range.from).setHours(0,0,0,0);
  const toTime = new Date(range.to).setHours(23,59,59,999);
  return reports.filter(r => {
    const time = new Date(r.date).getTime();
    return time >= fromTime && time <= toTime;
  });
}

export function generateCSV(reports) {
  const headers = ['id','userId','userName','date','message','projectId','tasks','subtasks'];
  const rows = reports.map(r => {
    const tasks = r.completedTasks.length;
    const subtasks = r.completedSubtasks.length;
    const row = [
      r.id,
      r.userId,
      r.userName,
      new Date(r.date).toISOString(),
      (r.message || '').replace(/\n/g,' '),
      r.projectId || '',
      tasks,
      subtasks
    ];
    return row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

