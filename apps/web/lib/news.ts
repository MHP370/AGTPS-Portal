import { api } from "./api";
import type { Site } from "./sites";

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  image?: string;
  published: boolean;
  siteId: string;
  site?: Site;
  createdAt: string;
}

export interface CreateNewsDto {
  title: string;
  body: string;
  siteId: string;
  image?: string;
  published?: boolean;
}

export const newsQueryKey = ["news"];

export function getNews() {
  return api.get<NewsItem[]>("/news");
}

export function createNews(dto: CreateNewsDto) {
  return api.post<NewsItem>("/news", dto);
}

export function updateNews(id: string, dto: Partial<CreateNewsDto>) {
  return api.put<NewsItem>(`/news/${id}`, dto);
}

export function deleteNews(id: string) {
  return api.delete<void>(`/news/${id}`);
}
