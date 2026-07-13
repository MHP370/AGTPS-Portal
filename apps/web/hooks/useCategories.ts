"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  applicationQueryKey,
  portalApplicationQueryKey,
} from "@/lib/applications";
import {
  categoryQueryKey,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type CreateCategoryDto,
} from "@/lib/categories";

export function useCategories() {
  return useQuery({
    queryKey: categoryQueryKey,
    queryFn: getCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCategoryDto) =>
      createCategory(dto),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: applicationQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: portalApplicationQueryKey,
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateCategoryDto>;
    }) => updateCategory(id, dto),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: applicationQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: portalApplicationQueryKey,
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteCategory(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: applicationQueryKey,
      });
      queryClient.invalidateQueries({
        queryKey: portalApplicationQueryKey,
      });
    },
  });
}
