"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createInPersonParticipant,
  createInPersonTraining,
  createTrainingCategory,
  createTrainingItem,
  createTrainingSource,
  deleteInPersonParticipant,
  deleteInPersonTraining,
  deleteTrainingCategory,
  deleteTrainingItem,
  deleteTrainingSource,
  getAdminInPersonTrainings,
  getAdminTrainingCategories,
  getAdminTrainingSources,
  getAdminTrainings,
  getPublishedTrainings,
  getTrainingProgress,
  getTrainingCategories,
  inPersonTrainingsQueryKey,
  trainingCategoriesQueryKey,
  trainingSourcesQueryKey,
  trainingsQueryKey,
  upsertTrainingProgress,
  updateInPersonParticipant,
  updateInPersonTraining,
  updateTrainingCategory,
  updateTrainingItem,
  updateTrainingSource,
  type CreateInPersonParticipantDto,
  type CreateInPersonTrainingDto,
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
    queryFn: () =>
      getTrainingProgress(trainingItemId || "", getTrainingVisitorKey()),
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

export function useAdminInPersonTrainings() {
  return useQuery({
    queryKey: inPersonTrainingsQueryKey,
    queryFn: getAdminInPersonTrainings,
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

export function useCreateInPersonTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateInPersonTrainingDto) => createInPersonTraining(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inPersonTrainingsQueryKey });
    },
  });
}

export function useUpdateInPersonTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateInPersonTrainingDto>;
    }) => updateInPersonTraining(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inPersonTrainingsQueryKey });
    },
  });
}

export function useDeleteInPersonTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInPersonTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inPersonTrainingsQueryKey });
    },
  });
}

export function useCreateInPersonParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trainingId,
      dto,
    }: {
      trainingId: string;
      dto: CreateInPersonParticipantDto;
    }) => createInPersonParticipant(trainingId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inPersonTrainingsQueryKey });
    },
  });
}

export function useUpdateInPersonParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateInPersonParticipantDto>;
    }) => updateInPersonParticipant(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inPersonTrainingsQueryKey });
    },
  });
}

export function useDeleteInPersonParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInPersonParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inPersonTrainingsQueryKey });
    },
  });
}

export function useCreateTrainingCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTrainingCategoryDto) => createTrainingCategory(dto),
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
