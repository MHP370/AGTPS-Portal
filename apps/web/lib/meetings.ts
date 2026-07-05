import { api } from "./api";

export type MeetingStatus = "SCHEDULED" | "CANCELLED" | "DONE";
export type MeetingVisibility = "PUBLIC" | "PRIVATE";

export interface MeetingParticipant {
  id: string;
  userId?: string;
  directoryUserId?: string;
  displayName: string;
  email?: string;
  notificationSent: boolean;
  responseStatus?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt?: string | null;
  status: MeetingStatus;
  visibility: MeetingVisibility;
  isPublished: boolean;
  organizerId?: string | null;
  organizerDirectoryUserId?: string | null;
  participants: MeetingParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt?: string;
  status?: MeetingStatus;
  visibility?: MeetingVisibility;
  isPublished?: boolean;
  organizerId?: string;
  organizerDirectoryUserId?: string;
  participants?: Array<{
    userId?: string;
    directoryUserId?: string;
    displayName: string;
    email?: string;
  }>;
}

export const meetingsQueryKey = ["meetings"];

export function getMeetings() {
  return api.get<Meeting[]>("/meetings");
}

export function getAdminMeetings() {
  return api.get<Meeting[]>("/meetings/admin/all");
}

export function createMeeting(dto: CreateMeetingDto) {
  return api.post<Meeting>("/meetings", dto);
}

export function updateMeeting(
  id: string,
  dto: Partial<CreateMeetingDto>,
) {
  return api.put<Meeting>(`/meetings/${id}`, dto);
}

export function deleteMeeting(id: string) {
  return api.delete<void>(`/meetings/${id}`);
}
