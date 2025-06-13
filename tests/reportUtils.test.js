import assert from 'assert';
import { filterReportsByDate, generateCSV } from '../src/lib/reportUtils.js';

const baseReport = {
  id: '1',
  userId: 'u1',
  userName: 'User',
  date: new Date('2024-06-10'),
  message: 'done',
  completedTasks: [],
  completedSubtasks: [],
  projectId: 'p1'
};

const reports = [
  { ...baseReport, id: '1', date: new Date('2024-06-10') },
  { ...baseReport, id: '2', date: new Date('2024-06-12') },
];

const filtered = filterReportsByDate(reports, { from: new Date('2024-06-11'), to: new Date('2024-06-12') });
assert.strictEqual(filtered.length, 1);
assert.strictEqual(filtered[0].id, '2');

const csv = generateCSV(filtered);
assert(csv.includes('2')); // csv should contain id 2

console.log('All tests passed');
