import { getAccessToken } from "./auth";
import { api } from "./api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

export interface ShareAccess {
  id: string;
  canRead?: boolean;
  canDownload?: boolean;
  canUpload?: boolean;
  canDelete?: boolean;
}

export interface FileShare {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  rootPath?: string;
  icon?: string | null;
  color?: string | null;
  allowDownload: boolean;
  allowUpload: boolean;
  allowDelete: boolean;
  isActive?: boolean;
  sortOrder?: number;
  userAccesses?: Array<ShareAccess & { directoryUserId: string }>;
  groupAccesses?: Array<ShareAccess & { directoryGroupId: string }>;
  access?: {
    canRead: boolean;
    canDownload: boolean;
    canUpload: boolean;
    canDelete: boolean;
  };
}

export interface FileShareItem {
  name: string;
  path: string;
  type: "folder" | "file";
  size: number | null;
  modifiedAt: string;
  extension: string | null;
}

export interface FileShareListResponse {
  share: FileShare;
  path: string;
  items: FileShareItem[];
}

export interface CreateFileShareDto {
  key: string;
  title: string;
  description?: string;
  rootPath: string;
  icon?: string;
  color?: string;
  allowDownload?: boolean;
  allowUpload?: boolean;
  allowDelete?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  userAccesses?: ShareAccess[];
  groupAccesses?: ShareAccess[];
}

export const fileSharesQueryKey = ["file-shares"];

export function getFileShares() {
  return api.get<FileShare[]>("/file-shares");
}

export function getAdminFileShares() {
  return api.get<FileShare[]>("/file-shares/admin/all");
}

export function getFileShareItems(shareId: string, path = "") {
  const query = path ? `?path=${encodeURIComponent(path)}` : "";
  return api.get<FileShareListResponse>(`/file-shares/${shareId}/items${query}`);
}

export function createFileShare(dto: CreateFileShareDto) {
  return api.post<FileShare>("/file-shares", dto);
}

export function updateFileShare(id: string, dto: Partial<CreateFileShareDto>) {
  return api.put<FileShare>(`/file-shares/${id}`, dto);
}

export function deleteFileShare(id: string) {
  return api.delete<void>(`/file-shares/${id}`);
}

export async function fetchFileShareFile(
  shareId: string,
  path: string,
  mode: "inline" | "download" = "inline",
) {
  const token = getAccessToken();
  const response = await fetch(
    `${API_BASE_URL}/file-shares/${shareId}/file?path=${encodeURIComponent(
      path,
    )}&mode=${mode}`,
    {
      cache: "no-store",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error(response.statusText || "File request failed.");
  }

  return response.blob();
}
