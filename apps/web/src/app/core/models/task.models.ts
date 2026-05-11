export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
  assignee: { id: string; name: string };
  contact?: { id: string; name: string };
  deal?: { id: string; title: string };
  createdAt: string;
}
