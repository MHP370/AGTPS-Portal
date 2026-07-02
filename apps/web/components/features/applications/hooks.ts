"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createApplication,
  CreateApplicationDto,
} from "./application.service";

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateApplicationDto) =>
      createApplication(dto),

    onSuccess: () => {
      toast.success("سامانه با موفقیت ایجاد شد.");

      queryClient.invalidateQueries({
        queryKey: ["applications"],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
