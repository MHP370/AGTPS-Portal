import { api } from "./api";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  startDate: string;
  endDate?: string | null;
  priority: number;
  published: boolean;
  createdAt: string;
}

export interface CreateAnnouncementDto {
  title: string;
  body: string;
  startDate: string;
  endDate?: string;
  priority?: number;
  published?: boolean;
}

export const announcementsQueryKey = ["announcements"];

export function getAnnouncements() {
  return api.get<Announcement[]>("/announcements");
}

export function createAnnouncement(dto: CreateAnnouncementDto) {
  return api.post<Announcement>("/announcements", dto);
}

export function updateAnnouncement(
  id: string,
  dto: Partial<CreateAnnouncementDto>,
) {
  return api.put<Announcement>(`/announcements/${id}`, dto);
}

export function deleteAnnouncement(id: string) {
  return api.delete<void>(`/announcements/${id}`);
}
