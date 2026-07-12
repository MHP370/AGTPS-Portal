"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  clonePollSurvey,
  createPollSurvey,
  deletePollSurvey,
  getAdminPollSurvey,
  getAdminPollSurveys,
  getPollSurveyResults,
  getPollSurveys,
  getPublicPollSurveyResults,
  pollSurveysQueryKey,
  submitPollSurveyResponse,
  updatePollSurvey,
  type CreatePollSurveyDto,
  type PollSurveyType,
  type SubmitPollSurveyResponseDto,
} from "@/lib/poll-surveys";

const POLL_SURVEY_VISITOR_KEY = "poll_survey_visitor_key";

export function getPollSurveyVisitorKey() {
  if (typeof window === "undefined") return "server";

  const existing = localStorage.getItem(POLL_SURVEY_VISITOR_KEY);
  if (existing) return existing;

  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(POLL_SURVEY_VISITOR_KEY, next);
  return next;
}

export function usePollSurveys(type?: PollSurveyType) {
  return useQuery({
    queryKey: [...pollSurveysQueryKey, type ?? "all"],
    queryFn: () => getPollSurveys(type, getPollSurveyVisitorKey()),
  });
}

export function useAdminPollSurveys(type?: PollSurveyType) {
  return useQuery({
    queryKey: [...pollSurveysQueryKey, "admin", type ?? "all"],
    queryFn: () => getAdminPollSurveys(type),
  });
}

export function usePollSurveyResults(id?: string) {
  return useQuery({
    queryKey: [...pollSurveysQueryKey, id, "results"],
    queryFn: () => getPollSurveyResults(id || ""),
    enabled: Boolean(id),
  });
}

export function usePublicPollSurveyResults(id?: string) {
  return useQuery({
    queryKey: [...pollSurveysQueryKey, id, "public-results"],
    queryFn: () => getPublicPollSurveyResults(id || ""),
    enabled: Boolean(id),
  });
}

export function useAdminPollSurvey(id?: string) {
  return useQuery({
    queryKey: [...pollSurveysQueryKey, "admin", id],
    queryFn: () => getAdminPollSurvey(id || ""),
    enabled: Boolean(id),
  });
}

export function useCreatePollSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePollSurveyDto) => createPollSurvey(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pollSurveysQueryKey });
    },
  });
}

export function useUpdatePollSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreatePollSurveyDto>;
    }) => updatePollSurvey(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pollSurveysQueryKey });
    },
  });
}

export function useDeletePollSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePollSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pollSurveysQueryKey });
    },
  });
}

export function useClonePollSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clonePollSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pollSurveysQueryKey });
    },
  });
}

export function useSubmitPollSurveyResponse(id?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Omit<SubmitPollSurveyResponseDto, "participantKey">) =>
      submitPollSurveyResponse(id || "", {
        ...dto,
        participantKey: getPollSurveyVisitorKey(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pollSurveysQueryKey });
    },
  });
}
