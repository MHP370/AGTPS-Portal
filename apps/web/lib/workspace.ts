import { api } from "./api";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface PortalNote {
  id: string;
  title: string;
  body: string;
  color?: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortalReminder {
  id: string;
  title: string;
  description?: string;
  remindAt: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortalTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  status: TaskStatus;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export const notesQueryKey = ["workspace", "notes"];
export const remindersQueryKey = ["workspace", "reminders"];
export const tasksQueryKey = ["workspace", "tasks"];

export function getNotes() {
  return api.get<PortalNote[]>("/workspace/notes");
}

export function createNote(dto: {
  title: string;
  body: string;
  color?: string;
  isPinned?: boolean;
}) {
  return api.post<PortalNote>("/workspace/notes", dto);
}

export function deleteNote(id: string) {
  return api.delete<void>(`/workspace/notes/${id}`);
}

export function getReminders() {
  return api.get<PortalReminder[]>("/workspace/reminders");
}

export function createReminder(dto: {
  title: string;
  description?: string;
  remindAt: string;
  completed?: boolean;
}) {
  return api.post<PortalReminder>("/workspace/reminders", dto);
}

export function updateReminder(
  id: string,
  dto: Partial<{
    title: string;
    description?: string;
    remindAt: string;
    completed: boolean;
  }>,
) {
  return api.put<PortalReminder>(`/workspace/reminders/${id}`, dto);
}

export function deleteReminder(id: string) {
  return api.delete<void>(`/workspace/reminders/${id}`);
}

export function getTasks() {
  return api.get<PortalTask[]>("/workspace/tasks");
}

export function createTask(dto: {
  title: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  priority?: number;
}) {
  return api.post<PortalTask>("/workspace/tasks", dto);
}

export function updateTask(
  id: string,
  dto: Partial<{
    title: string;
    description?: string;
    dueDate?: string;
    status: TaskStatus;
    priority: number;
  }>,
) {
  return api.put<PortalTask>(`/workspace/tasks/${id}`, dto);
}

export function deleteTask(id: string) {
  return api.delete<void>(`/workspace/tasks/${id}`);
}
