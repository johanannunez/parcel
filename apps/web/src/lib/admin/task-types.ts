import type { DueBucket } from './due-buckets';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskType = 'todo' | 'call' | 'meeting' | 'email' | 'milestone';
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
  priority: 1 | 2 | 3 | 4; // 1=Urgent, 2=High, 3=Medium, 4=None
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
  tags: string[];
  labelIds: string[];
  linkedPropertyId: string | null;
  linkedContactId: string | null;
  linkedProjectId: string | null;
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

export type TaskLabel = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
};

export type TaskComment = {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskActivityEntry = {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  actorName: string | null;
  actorAvatarUrl: string | null;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, string> | null;
  readAt: string | null;
  createdAt: string;
};
