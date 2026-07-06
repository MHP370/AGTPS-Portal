"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createTrainingCategory,
  createTrainingItem,
  createTrainingSource,
  deleteTrainingCategory,
  deleteTrainingItem,
  deleteTrainingSource,
  getAdminTrainingCategories,
  getAdminTrainingSources,
  getAdminTrainings,
  getPublishedTrainings,
  getTrainingCategories,
  trainingCategoriesQueryKey,
  trainingSourcesQueryKey,
  trainingsQueryKey,
  updateTrainingCategory,
  updateTrainingItem,
  updateTrainingSource,
  type CreateTrainingCategoryDto,
  type CreateTrainingItemDto,
  type CreateTrainingSourceDto,
} from "@/lib/trainings";

export function useTrainings() {
  return useQuery({
    queryKey: trainingsQueryKey,
    queryFn: getPublishedTrainings,
  });
}

export function useAdminTrainings() {
  return useQuery({
    queryKey: [...trainingsQueryKey, "admin"],
    queryFn: getAdminTrainings,
  });
}

export function useTrainingCategories() {
  return useQuery({
    queryKey: trainingCategoriesQueryKey,
    queryFn: getTrainingCategories,
  });
}

export function useAdminTrainingCategories() {
  return useQuery({
    queryKey: [...trainingCategoriesQueryKey, "admin"],
    queryFn: getAdminTrainingCategories,
  });
}

export function useAdminTrainingSources() {
  return useQuery({
    queryKey: trainingSourcesQueryKey,
    queryFn: getAdminTrainingSources,
  });
}

export function useCreateTrainingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTrainingItemDto) => createTrainingItem(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingsQueryKey });
    },
  });
}

export function useUpdateTrainingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateTrainingItemDto>;
    }) => updateTrainingItem(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingsQueryKey });
    },
  });
}

export function useDeleteTrainingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTrainingItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingsQueryKey });
    },
  });
}

export function useCreateTrainingCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTrainingCategoryDto) =>
      createTrainingCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trainingCategoriesQueryKey,
      });
    },
  });
}

export function useUpdateTrainingCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateTrainingCategoryDto>;
    }) => updateTrainingCategory(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trainingCategoriesQueryKey,
      });
    },
  });
}

export function useDeleteTrainingCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTrainingCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trainingCategoriesQueryKey,
      });
    },
  });
}

export function useCreateTrainingSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTrainingSourceDto) => createTrainingSource(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trainingSourcesQueryKey,
      });
    },
  });
}

export function useUpdateTrainingSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateTrainingSourceDto>;
    }) => updateTrainingSource(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trainingSourcesQueryKey,
      });
    },
  });
}

export function useDeleteTrainingSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTrainingSource,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trainingSourcesQueryKey,
      });
    },
  });
}
