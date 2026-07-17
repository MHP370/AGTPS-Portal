"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  cancelQueuedEmail,
  createNotificationTemplate,
  createSmtpServer,
  deleteNotificationTemplate,
  deleteSmtpServer,
  getEmailQueue,
  getNotificationStats,
  getNotificationRules,
  getNotificationTemplates,
  getSmtpServers,
  notificationCenterQueryKey,
  processEmailQueue,
  queueEmail,
  sendQueuedEmail,
  testSmtpServer,
  updateNotificationRule,
  updateNotificationTemplate,
  updateSmtpServer,
  type CreateNotificationTemplateDto,
  type CreateSmtpServerDto,
  type QueueEmailDto,
  type UpdateNotificationRuleDto,
} from "@/lib/notification-center";

function useInvalidateNotificationCenter() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: notificationCenterQueryKey,
    });
  };
}

export function useNotificationStats() {
  return useQuery({
    queryKey: [...notificationCenterQueryKey, "stats"],
    queryFn: getNotificationStats,
  });
}

export function useSmtpServers() {
  return useQuery({
    queryKey: [...notificationCenterQueryKey, "smtp"],
    queryFn: getSmtpServers,
  });
}

export function useCreateSmtpServer() {
  const invalidate = useInvalidateNotificationCenter();

  return useMutation({
    mutationFn: createSmtpServer,
    onSuccess: invalidate,
  });
}

export function useUpdateSmtpServer() {
  const invalidate = useInvalidateNotificationCenter();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateSmtpServerDto>;
    }) => updateSmtpServer(id, dto),
    onSuccess: invalidate,
  });
}

export function useDeleteSmtpServer() {
  const invalidate = useInvalidateNotificationCenter();

  return useMutation({
    mutationFn: deleteSmtpServer,
    onSuccess: invalidate,
  });
}

export function useTestSmtpServer() {
  const invalidate = useInvalidateNotificationCenter();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: { recipientEmail?: string; subject?: string; body?: string };
    }) => testSmtpServer(id, dto),
    onSuccess: invalidate,
  });
}

export function useNotificationTemplates() {
  return useQuery({
    queryKey: [...notificationCenterQueryKey, "templates"],
    queryFn: getNotificationTemplates,
  });
}

export function useCreateNotificationTemplate() {
  const invalidate = useInvalidateNotificationCenter();

  return useMutation({
    mutationFn: createNotificationTemplate,
    onSuccess: invalidate,
  });
}

export function useUpdateNotificationTemplate() {
  const invalidate = useInvalidateNotificationCenter();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateNotificationTemplateDto>;
    }) => updateNotificationTemplate(id, dto),
    onSuccess: invalidate,
  });
}

export function useDeleteNotificationTemplate() {
  const invalidate = useInvalidateNotificationCenter();

  return useMutation({
    mutationFn: deleteNotificationTemplate,
    onSuccess: invalidate,
  });
}

export function useNotificationRules() {
  return useQuery({
    queryKey: [...notificationCenterQueryKey, "rules"],
    queryFn: getNotificationRules,
  });
}

export function useUpdateNotificationRule() {
  const invalidate = useInvalidateNotificationCenter();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateNotificationRuleDto;
    }) => updateNotificationRule(id, dto),
    onSuccess: invalidate,
  });
}

export function useEmailQueue() {
  return useQuery({
    queryKey: [...notificationCenterQueryKey, "email-queue"],
    queryFn: getEmailQueue,
  });
}

export function useQueueEmail() {
  const invalidate = useInvalidateNotificationCenter();

  return useMutation({
    mutationFn: (dto: QueueEmailDto) => queueEmail(dto),
    onSuccess: invalidate,
  });
}

export function useProcessEmailQueue() {
  const invalidate = useInvalidateNotificationCenter();

  return useMutation({
    mutationFn: processEmailQueue,
    onSuccess: invalidate,
  });
}

export function useSendQueuedEmail() {
  const invalidate = useInvalidateNotificationCenter();

  return useMutation({
    mutationFn: sendQueuedEmail,
    onSuccess: invalidate,
  });
}

export function useCancelQueuedEmail() {
  const invalidate = useInvalidateNotificationCenter();

  return useMutation({
    mutationFn: cancelQueuedEmail,
    onSuccess: invalidate,
  });
}
