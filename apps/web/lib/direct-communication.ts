import { api } from "./api";
import type { DirectoryUser } from "./directory";
import type { AdminUser } from "./users";

export interface DirectCommunicationManager {
  id: string;
  title: string;
  department?: string | null;
  description?: string | null;
  isCeo: boolean;
  isActive: boolean;
  portalUserId?: string | null;
  directoryUserId?: string | null;
  portalUser?: Pick<
    AdminUser,
    "id" | "username" | "email" | "firstName" | "lastName"
  > | null;
  directoryUser?: DirectoryUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface DirectForbiddenWord {
  id: string;
  word: string;
  normalizedWord: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DirectCommunicationMode = "NORMAL" | "CONFIDENTIAL" | "ANONYMOUS";
export type DirectCommunicationCategory =
  | "SUGGESTION"
  | "COMPLAINT"
  | "VIOLATION_REPORT"
  | "IMPROVEMENT_IDEA"
  | "REQUEST"
  | "CONFIDENTIAL_REPORT"
  | "GENERAL_MESSAGE";
export type DirectCommunicationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type DirectCommunicationStatus = "OPEN" | "RESOLVED" | "ARCHIVED" | "CLOSED";

export interface DirectMessagingConfig {
  enabled: boolean;
  encryptionVersion: string;
  reason: string | null;
  securityNotes: string[];
}

export interface DirectConversation {
  id: string;
  mode: DirectCommunicationMode;
  category: DirectCommunicationCategory;
  priority: DirectCommunicationPriority;
  status: DirectCommunicationStatus;
  subject: string;
  tags: string[];
  senderDisplayName?: string | null;
  isReadByManager: boolean;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
  manager: Pick<
    DirectCommunicationManager,
    "id" | "title" | "department" | "isCeo" | "isActive"
  >;
  senderUser?: Pick<
    AdminUser,
    "id" | "username" | "email" | "firstName" | "lastName"
  > | null;
  senderDirectoryUser?: DirectoryUser | null;
  messages: Array<{
    id: string;
    senderType: "EMPLOYEE" | "MANAGER" | "SYSTEM";
    encryptionVersion: string;
    createdAt: string;
  }>;
  _count: {
    messages: number;
  };
}

export interface DirectConversationMessage {
  id: string;
  senderType: "EMPLOYEE" | "MANAGER" | "SYSTEM";
  senderUserId?: string | null;
  senderDirectoryUserId?: string | null;
  encryptionVersion: string;
  body?: string | null;
  createdAt: string;
}

export interface DirectConversationDetail
  extends Omit<DirectConversation, "messages"> {
  messages: DirectConversationMessage[];
}

export interface DirectManagerDto {
  title: string;
  department?: string;
  description?: string;
  isCeo?: boolean;
  isActive?: boolean;
  portalUserId?: string;
  directoryUserId?: string;
}

export interface ForbiddenWordDto {
  word: string;
  description?: string;
  isActive?: boolean;
}

export interface DirectConversationDto {
  managerId: string;
  mode?: DirectCommunicationMode;
  category?: DirectCommunicationCategory;
  priority?: DirectCommunicationPriority;
  subject: string;
  encryptedPayload: string;
  tags?: string[];
  anonymousTokenHash?: string;
}

export interface DirectUserConversationDto {
  managerId: string;
  mode?: DirectCommunicationMode;
  category?: DirectCommunicationCategory;
  priority?: DirectCommunicationPriority;
  subject: string;
  message: string;
  tags?: string[];
}

export const directCommunicationQueryKey = ["direct-communication"];

export function getDirectManagers() {
  return api.get<DirectCommunicationManager[]>(
    "/direct-communication/managers",
  );
}

export function getAvailableDirectManagers() {
  return api.get<
    Pick<
      DirectCommunicationManager,
      "id" | "title" | "department" | "description" | "isCeo"
    >[]
  >("/direct-communication/available-managers");
}

export function getDirectMessagingConfig() {
  return api.get<DirectMessagingConfig>(
    "/direct-communication/messaging/config",
  );
}

export function getDirectConversations() {
  return api.get<DirectConversation[]>("/direct-communication/conversations");
}

export function getMyDirectConversations() {
  return api.get<DirectConversation[]>(
    "/direct-communication/my/conversations",
  );
}

export function getMyDirectInbox() {
  return api.get<DirectConversation[]>("/direct-communication/my/inbox");
}

export function getMyDirectConversationDetail(id: string) {
  return api.get<DirectConversationDetail>(
    `/direct-communication/my/conversations/${id}`,
  );
}

export function createDirectConversation(dto: DirectConversationDto) {
  return api.post<DirectConversation>(
    "/direct-communication/conversations",
    dto,
  );
}

export function createMyDirectConversation(dto: DirectUserConversationDto) {
  return api.post<DirectConversation>(
    "/direct-communication/my/conversations",
    dto,
  );
}

export function replyToMyDirectConversation(id: string, message: string) {
  return api.post<DirectConversationDetail>(
    `/direct-communication/my/conversations/${id}/replies`,
    { message },
  );
}

export function updateMyDirectInboxStatus(
  id: string,
  status: DirectCommunicationStatus,
) {
  return api.put<DirectConversation>(
    `/direct-communication/my/inbox/${id}/status`,
    { status },
  );
}

export function updateDirectConversationStatus(
  id: string,
  status: DirectCommunicationStatus,
) {
  return api.put<DirectConversation>(
    `/direct-communication/conversations/${id}/status`,
    { status },
  );
}

export function createDirectManager(dto: DirectManagerDto) {
  return api.post<DirectCommunicationManager>(
    "/direct-communication/managers",
    dto,
  );
}

export function updateDirectManager(id: string, dto: Partial<DirectManagerDto>) {
  return api.put<DirectCommunicationManager>(
    `/direct-communication/managers/${id}`,
    dto,
  );
}

export function deleteDirectManager(id: string) {
  return api.delete<DirectCommunicationManager>(
    `/direct-communication/managers/${id}`,
  );
}

export function getForbiddenWords() {
  return api.get<DirectForbiddenWord[]>(
    "/direct-communication/forbidden-words",
  );
}

export function createForbiddenWord(dto: ForbiddenWordDto) {
  return api.post<DirectForbiddenWord>(
    "/direct-communication/forbidden-words",
    dto,
  );
}

export function updateForbiddenWord(id: string, dto: Partial<ForbiddenWordDto>) {
  return api.put<DirectForbiddenWord>(
    `/direct-communication/forbidden-words/${id}`,
    dto,
  );
}

export function deleteForbiddenWord(id: string) {
  return api.delete<DirectForbiddenWord>(
    `/direct-communication/forbidden-words/${id}`,
  );
}
