import { api } from "@/lib/api";

export interface CreateApplicationDto {
  title: string;
  key: string;
  slug: string;
  categoryId: string;
}

export function createApplication(
  dto: CreateApplicationDto,
  token?: string,
) {
  return api.post("/applications", dto, token);
}

export function updateApplication(
  id: string,
  dto: Partial<CreateApplicationDto>,
  token?: string,
) {
  return api.put(`/applications/${id}`, dto, token);
}

export function deleteApplication(
  id: string,
  token?: string,
) {
  return api.delete(`/applications/${id}`, token);
}
