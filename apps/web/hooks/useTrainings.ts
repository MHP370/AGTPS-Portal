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
  getInPersonTrainingDetail,
  getCourseReports,
  getTrainingUsers,
  unlockInPersonTraining,
  getAdminTrainingCategories,
  getAdminTrainingSources,
  getAdminTrainings,
  getAdminTrainingTree,
  getPublishedTrainings,
  getTrainingProgress,
  getTrainingCategories,
  getEligibleTrainingParticipants,
  enrollDirectoryUsers,
  getMyCourses,
  getAdminTrainingExam,
  getAdminTrainingExams,
  saveTrainingExam,
  getMyTrainingExam,
  startTrainingExam,
  submitTrainingExam,
  getCertificateTemplates,
  getCertificateSignatories,
  createCertificateSignatory,
  updateCertificateSignatory,
  generateCourseCertificates,
  createCertificateTemplate,
  updateCertificateTemplate,
  issueTrainingCertificate,
  inPersonTrainingsQueryKey,
  eligibleTrainingParticipantsQueryKey,
  myCoursesQueryKey,
  trainingCategoriesQueryKey,
  trainingSourcesQueryKey,
  trainingsQueryKey,
  upsertTrainingProgress,
  updateInPersonParticipant,
  updateInPersonTraining,
  updateTrainingCategory,
  updateTrainingItem,
  updateTrainingSource,
  testTrainingSource,
  syncTrainingSource,
  uploadTrainingSourceFile,
  type CreateInPersonParticipantDto,
  type CreateInPersonTrainingDto,
  type CreateTrainingCategoryDto,
  type CreateTrainingItemDto,
  type CreateTrainingSourceDto,
  type UpsertTrainingProgressDto,
  type TrainingExam,
  type TrainingCertificateTemplate,
  type TrainingCertificateSignatory,
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

export function useTrainings(enabled = true) {
  return useQuery({
    queryKey: trainingsQueryKey,
    queryFn: getPublishedTrainings,
    enabled,
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

export function useAdminTrainingTree(id?: string) {
  return useQuery({
    queryKey: [...trainingsQueryKey, "admin", id, "tree"],
    queryFn: () => getAdminTrainingTree(id || ""),
    enabled: Boolean(id),
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

export function useUploadTrainingSourceFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sourceId,
      trainingSlug,
      file,
    }: {
      sourceId: string;
      trainingSlug: string;
      file: File;
    }) => uploadTrainingSourceFile(sourceId, trainingSlug, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingsQueryKey });
      queryClient.invalidateQueries({ queryKey: trainingSourcesQueryKey });
    },
  });
}

export function useAdminInPersonTrainings() {
  return useQuery({
    queryKey: inPersonTrainingsQueryKey,
    queryFn: getAdminInPersonTrainings,
  });
}

export function useInPersonTrainingDetail(id?: string) {
  return useQuery({ queryKey: [...inPersonTrainingsQueryKey, id, "detail"], queryFn: () => getInPersonTrainingDetail(id || ""), enabled: Boolean(id) });
}

export function useCourseReports() { return useQuery({ queryKey: [...inPersonTrainingsQueryKey, "reports"], queryFn: getCourseReports }); }
export function useTrainingUsers(search: string, page: number) { return useQuery({ queryKey: [...inPersonTrainingsQueryKey, "users", search, page], queryFn: () => getTrainingUsers(search, page), placeholderData: (previous) => previous }); }

export function useUnlockInPersonTraining() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => unlockInPersonTraining(id, reason), onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: inPersonTrainingsQueryKey }); queryClient.invalidateQueries({ queryKey: [...inPersonTrainingsQueryKey, variables.id, "detail"] }); } });
}

export function useEligibleTrainingParticipants(
  search: string,
  page: number,
) {
  return useQuery({
    queryKey: [...eligibleTrainingParticipantsQueryKey, search, page],
    queryFn: () => getEligibleTrainingParticipants(search, page),
    placeholderData: (previous) => previous,
  });
}

export function useEnrollDirectoryUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      trainingId,
      directoryUserIds,
    }: {
      trainingId: string;
      directoryUserIds: string[];
    }) => enrollDirectoryUsers(trainingId, directoryUserIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inPersonTrainingsQueryKey });
      queryClient.invalidateQueries({ queryKey: myCoursesQueryKey });
    },
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: myCoursesQueryKey,
    queryFn: getMyCourses,
  });
}

export function useAdminTrainingExam(trainingId?: string) {
  return useQuery({
    queryKey: [...inPersonTrainingsQueryKey, trainingId, "exam"],
    queryFn: () => getAdminTrainingExam(trainingId || ""),
    enabled: Boolean(trainingId),
  });
}
export function useAdminTrainingExams() { return useQuery({ queryKey: [...inPersonTrainingsQueryKey, "exams"], queryFn: getAdminTrainingExams }); }

export function useSaveTrainingExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trainingId, dto }: { trainingId: string; dto: Omit<TrainingExam, "id" | "trainingId"> }) => saveTrainingExam(trainingId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...inPersonTrainingsQueryKey, variables.trainingId, "exam"] });
      queryClient.invalidateQueries({ queryKey: inPersonTrainingsQueryKey });
      queryClient.invalidateQueries({ queryKey: myCoursesQueryKey });
    },
  });
}

export function useMyTrainingExam(trainingId?: string) {
  return useQuery({
    queryKey: [...myCoursesQueryKey, trainingId, "exam"],
    queryFn: () => getMyTrainingExam(trainingId || ""),
    enabled: Boolean(trainingId),
  });
}

export function useStartTrainingExam() {
  return useMutation({ mutationFn: startTrainingExam });
}

export function useSubmitTrainingExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attemptId, answers }: { attemptId: string; answers: Array<{ questionId: string; value: unknown }> }) => submitTrainingExam(attemptId, answers),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myCoursesQueryKey }),
  });
}

export function useCertificateTemplates() {
  return useQuery({ queryKey: [...inPersonTrainingsQueryKey, "certificate-templates"], queryFn: getCertificateTemplates });
}
export function useCertificateSignatories() { return useQuery({ queryKey: [...inPersonTrainingsQueryKey, "certificate-signatories"], queryFn: getCertificateSignatories }); }
export function useCreateCertificateSignatory() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (dto: Omit<TrainingCertificateSignatory, "id">) => createCertificateSignatory(dto), onSuccess: () => queryClient.invalidateQueries({ queryKey: [...inPersonTrainingsQueryKey, "certificate-signatories"] }) });
}
export function useUpdateCertificateSignatory() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, dto }: { id: string; dto: Omit<TrainingCertificateSignatory, "id"> }) => updateCertificateSignatory(id, dto), onSuccess: () => queryClient.invalidateQueries({ queryKey: [...inPersonTrainingsQueryKey, "certificate-signatories"] }) });
}
export function useGenerateCourseCertificates() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, participantIds }: { id: string; participantIds?: string[] }) => generateCourseCertificates(id, participantIds), onSuccess: () => { queryClient.invalidateQueries({ queryKey: inPersonTrainingsQueryKey }); queryClient.invalidateQueries({ queryKey: myCoursesQueryKey }); } });
}

export function useCreateCertificateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Omit<TrainingCertificateTemplate, "id">) => createCertificateTemplate(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...inPersonTrainingsQueryKey, "certificate-templates"] }),
  });
}

export function useUpdateCertificateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Omit<TrainingCertificateTemplate, "id"> }) => updateCertificateTemplate(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...inPersonTrainingsQueryKey, "certificate-templates"] }),
  });
}

export function useIssueTrainingCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: issueTrainingCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inPersonTrainingsQueryKey });
      queryClient.invalidateQueries({ queryKey: myCoursesQueryKey });
    },
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

export function useTestTrainingSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: testTrainingSource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trainingSourcesQueryKey }),
  });
}

export function useSyncTrainingSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncTrainingSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingSourcesQueryKey });
      queryClient.invalidateQueries({ queryKey: trainingsQueryKey });
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
