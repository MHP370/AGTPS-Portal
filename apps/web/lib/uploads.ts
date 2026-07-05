import { api } from "./api";

export interface UploadedFileResult {
  url: string;
  fileName: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export function uploadImage(folder: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return api.upload<UploadedFileResult>(
    `/uploads/${folder}`,
    formData,
  );
}
