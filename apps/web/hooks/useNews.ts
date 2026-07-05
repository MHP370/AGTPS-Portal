"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createNews,
  deleteNews,
  getNews,
  newsQueryKey,
  updateNews,
  type CreateNewsDto,
} from "@/lib/news";

export function useNews() {
  return useQuery({
    queryKey: newsQueryKey,
    queryFn: getNews,
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateNewsDto) => createNews(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsQueryKey });
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateNewsDto>;
    }) => updateNews(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsQueryKey });
    },
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNews(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsQueryKey });
    },
  });
}
