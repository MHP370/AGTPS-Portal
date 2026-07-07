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
  getTrainingProgress,
  getTrainingCategories,
  trainingCategoriesQueryKey,
  trainingSourcesQueryKey,
  trainingsQueryKey,
  upsertTrainingProgress,
  updateTrainingCategory,
  updateTrainingItem,
  updateTrainingSource,
  type CreateTrainingCategoryDto,
  type CreateTrainingItemDto,
  type CreateTrainingSourceDto,
  type UpsertTrainingProgressDto,
} from "@/lib/trainings";

const TRAINING_VISITOR_KEY = "training_visitor_key";

export function getTrainingVisitorKey() {
  if (typeof window === "undefined") return "server";

  const existing = localStorage.getItem(TRAINING_VISITOR_KEY);
  if (existing) return existing;

  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(TRAINING_VISITOR_KEY, next);
  return next;
}

export function useTrainings() {
  return useQuery({
    queryKey: trainingsQueryKey,
    queryFn: getPublishedTrainings,
  });
}

export function useTrainingProgress(trainingItemId?: string) {
  return useQuery({
    queryKey: [...trainingsQueryKey, trainingItemId, "progress"],
    queryFn: () => getTrainingProgress(trainingItemId || "", getTrainingVisitorKey()),
    enabled: Boolean(trainingItemId),
  });
}

export function useUpsertTrainingProgress(trainingItemId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Omit<UpsertTrainingProgressDto, "visitorKey">) =>
      upsertTrainingProgress(trainingItemId || "", {
        ...dto,
        visitorKey: getTrainingVisitorKey(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...trainingsQueryKey, trainingItemId, "progress"],
      });
    },
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
