import type { DueBucket } from './due-buckets';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type ParentType = 'contact' | 'property' | 'project';

export type TaskParent = {
  type: ParentType;
  id: string;
  label: string;
  contactProfileId?: string | null;
};

export type Task = {
  id: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeAvatarUrl: string | null;
  createdById: string | null;
  createdByName: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  parent: TaskParent | null;
  subtaskCount: number;
  subtaskDoneCount: number;
};

export type TaskGroup = {
  bucket: DueBucket;
  tasks: Task[];
};

export type TasksSavedView = {
  key: string;
  name: string;
  sortOrder: number;
  count: number;
};

export type TasksFetchResult = {
  groups: TaskGroup[];
  views: TasksSavedView[];
  activeView: TasksSavedView;
  totalCount: number;
};
