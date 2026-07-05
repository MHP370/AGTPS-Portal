"use client";

import { useMutation } from "@tanstack/react-query";

import { uploadImage } from "@/lib/uploads";

interface UploadImageVariables {
  folder: string;
  file: File;
}

export function useUploadImage() {
  return useMutation({
    mutationFn: ({ folder, file }: UploadImageVariables) =>
      uploadImage(folder, file),
  });
}
