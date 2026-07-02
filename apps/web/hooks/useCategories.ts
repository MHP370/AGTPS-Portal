"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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
    },
  });
}
