"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createSlider,
  deleteSlider,
  getSliders,
  slidersQueryKey,
  updateSlider,
  type CreateSliderDto,
} from "@/lib/sliders";

export function useSliders() {
  return useQuery({
    queryKey: slidersQueryKey,
    queryFn: getSliders,
  });
}

export function useCreateSlider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateSliderDto) => createSlider(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slidersQueryKey });
    },
  });
}

export function useUpdateSlider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateSliderDto>;
    }) => updateSlider(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slidersQueryKey });
    },
  });
}

export function useDeleteSlider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSlider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slidersQueryKey });
    },
  });
}
