import { taskToVTodo, parseVTodoStatus, parseVTodoUid } from '../src/lib/caldav-utils';

const task = {
  id: 'test-1',
  caldavUid: 'task-test-1@parcelco.com',
  title: 'Test Task; with comma, and backslash\\',
  dueAt: '2026-04-30T15:00:00.000Z',
  status: 'todo' as const,
  priority: 1 as const,
  updatedAt: '2026-04-28T12:00:00.000Z',
};

const vtodo = taskToVTodo(task, 'https://www.theparcelco.com');
console.log(vtodo);

console.assert(vtodo.includes('BEGIN:VTODO'), 'has VTODO block');
console.assert(vtodo.includes('UID:task-test-1@parcelco.com'), 'UID present');
console.assert(vtodo.includes('STATUS:NEEDS-ACTION'), 'correct status');
console.assert(vtodo.includes('PRIORITY:1'), 'priority 1 = urgent = caldav 1');
console.assert(vtodo.includes('DUE:20260430T'), 'has due date');
console.assert(!vtodo.includes('COMPLETED:'), 'no completed stamp for todo');

const statusResult = parseVTodoStatus(vtodo);
console.assert(statusResult === 'NEEDS-ACTION', 'parse status round-trip');

const uidResult = parseVTodoUid(vtodo);
console.assert(uidResult === 'task-test-1@parcelco.com', 'parse uid round-trip');

console.log('All assertions passed.');
