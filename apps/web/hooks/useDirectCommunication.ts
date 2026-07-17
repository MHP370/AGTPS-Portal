"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createDirectConversation,
  createDirectManager,
  createForbiddenWord,
  createMyDirectConversation,
  deleteDirectManager,
  deleteForbiddenWord,
  directCommunicationQueryKey,
  getAvailableDirectManagers,
  getDirectConversations,
  getDirectManagers,
  getDirectMessagingConfig,
  getForbiddenWords,
  getMyDirectConversationDetail,
  getMyDirectConversations,
  getMyDirectInbox,
  replyToMyDirectConversation,
  updateDirectConversationStatus,
  updateDirectManager,
  updateForbiddenWord,
  updateMyDirectInboxStatus,
  type DirectCommunicationStatus,
  type DirectConversationDto,
  type DirectManagerDto,
  type DirectUserConversationDto,
  type ForbiddenWordDto,
} from "@/lib/direct-communication";

function useInvalidateDirectCommunication() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: directCommunicationQueryKey,
    });
  };
}

export function useDirectManagers() {
  return useQuery({
    queryKey: [...directCommunicationQueryKey, "managers"],
    queryFn: getDirectManagers,
  });
}

export function useAvailableDirectManagers() {
  return useQuery({
    queryKey: [...directCommunicationQueryKey, "available-managers"],
    queryFn: getAvailableDirectManagers,
  });
}

export function useDirectMessagingConfig() {
  return useQuery({
    queryKey: [...directCommunicationQueryKey, "messaging-config"],
    queryFn: getDirectMessagingConfig,
  });
}

export function useDirectConversations() {
  return useQuery({
    queryKey: [...directCommunicationQueryKey, "conversations"],
    queryFn: getDirectConversations,
  });
}

export function useMyDirectConversations() {
  return useQuery({
    queryKey: [...directCommunicationQueryKey, "my-conversations"],
    queryFn: getMyDirectConversations,
  });
}

export function useMyDirectInbox() {
  return useQuery({
    queryKey: [...directCommunicationQueryKey, "my-inbox"],
    queryFn: getMyDirectInbox,
  });
}

export function useMyDirectConversationDetail(id?: string | null) {
  return useQuery({
    queryKey: [...directCommunicationQueryKey, "my-conversation-detail", id],
    queryFn: () => getMyDirectConversationDetail(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useCreateDirectConversation() {
  const invalidate = useInvalidateDirectCommunication();
  return useMutation({
    mutationFn: (dto: DirectConversationDto) => createDirectConversation(dto),
    onSuccess: invalidate,
  });
}

export function useCreateMyDirectConversation() {
  const invalidate = useInvalidateDirectCommunication();
  return useMutation({
    mutationFn: (dto: DirectUserConversationDto) =>
      createMyDirectConversation(dto),
    onSuccess: invalidate,
  });
}

export function useReplyToMyDirectConversation() {
  const invalidate = useInvalidateDirectCommunication();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      replyToMyDirectConversation(id, message),
    onSuccess: invalidate,
  });
}

export function useUpdateMyDirectInboxStatus() {
  const invalidate = useInvalidateDirectCommunication();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: DirectCommunicationStatus;
    }) => updateMyDirectInboxStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useUpdateDirectConversationStatus() {
  const invalidate = useInvalidateDirectCommunication();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: DirectCommunicationStatus;
    }) => updateDirectConversationStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useCreateDirectManager() {
  const invalidate = useInvalidateDirectCommunication();
  return useMutation({
    mutationFn: (dto: DirectManagerDto) => createDirectManager(dto),
    onSuccess: invalidate,
  });
}

export function useUpdateDirectManager() {
  const invalidate = useInvalidateDirectCommunication();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<DirectManagerDto>;
    }) => updateDirectManager(id, dto),
    onSuccess: invalidate,
  });
}

export function useDeleteDirectManager() {
  const invalidate = useInvalidateDirectCommunication();
  return useMutation({
    mutationFn: deleteDirectManager,
    onSuccess: invalidate,
  });
}

export function useForbiddenWords() {
  return useQuery({
    queryKey: [...directCommunicationQueryKey, "forbidden-words"],
    queryFn: getForbiddenWords,
  });
}

export function useCreateForbiddenWord() {
  const invalidate = useInvalidateDirectCommunication();
  return useMutation({
    mutationFn: (dto: ForbiddenWordDto) => createForbiddenWord(dto),
    onSuccess: invalidate,
  });
}

export function useUpdateForbiddenWord() {
  const invalidate = useInvalidateDirectCommunication();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<ForbiddenWordDto>;
    }) => updateForbiddenWord(id, dto),
    onSuccess: invalidate,
  });
}

export function useDeleteForbiddenWord() {
  const invalidate = useInvalidateDirectCommunication();
  return useMutation({
    mutationFn: deleteForbiddenWord,
    onSuccess: invalidate,
  });
}
