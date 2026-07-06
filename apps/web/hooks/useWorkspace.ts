"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createNote,
  createReminder,
  createTask,
  deleteNote,
  deleteReminder,
  deleteTask,
  getNotes,
  getReminders,
  getTasks,
  notesQueryKey,
  remindersQueryKey,
  tasksQueryKey,
  updateNote,
  updateReminder,
  updateTask,
  type TaskStatus,
} from "@/lib/workspace";

export function useNotes() {
  return useQuery({
    queryKey: notesQueryKey,
    queryFn: getNotes,
  });
}

export function useReminders() {
  return useQuery({
    queryKey: remindersQueryKey,
    queryFn: getReminders,
  });
}

export function useTasks() {
  return useQuery({
    queryKey: tasksQueryKey,
    queryFn: getTasks,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKey });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKey });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<{
        title: string;
        body: string;
        color?: string;
        isPinned: boolean;
      }>;
    }) => updateNote(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKey });
    },
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: remindersQueryKey });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<{
        title: string;
        description?: string;
        remindAt: string;
        completed: boolean;
        notifyBeforeMinutes: number;
      }>;
    }) => updateReminder(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: remindersQueryKey });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: remindersQueryKey });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<{
        title: string;
        description?: string;
        dueDate?: string;
        status: TaskStatus;
        priority: number;
        notifyBeforeMinutes: number;
      }>;
    }) => updateTask(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
  });
}
