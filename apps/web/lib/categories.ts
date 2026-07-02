import { api } from "./api";

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateCategoryDto {
  name: string;
  slug: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const categoryQueryKey = ["categories"];

export function getCategories() {
  return api.get<Category[]>("/categories");
}

export function createCategory(dto: CreateCategoryDto) {
  return api.post<Category>("/categories", dto);
}

export function updateCategory(
  id: string,
  dto: Partial<CreateCategoryDto>,
) {
  return api.put<Category>(`/categories/${id}`, dto);
}

export function deleteCategory(id: string) {
  return api.delete<void>(`/categories/${id}`);
}
