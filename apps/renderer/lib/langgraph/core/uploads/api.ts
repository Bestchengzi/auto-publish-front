/**
 * API functions for file uploads
 */

import { getBackendBaseURL } from "../config";
import { request, upload } from "@/lib/request";

export interface UploadedFileInfo {
  filename: string;
  size: number;
  path: string;
  virtual_path: string;
  artifact_url: string;
  extension?: string;
  modified?: number;
  markdown_file?: string;
  markdown_path?: string;
  markdown_virtual_path?: string;
  markdown_artifact_url?: string;
}

export interface UploadResponse {
  success: boolean;
  files: UploadedFileInfo[];
  message: string;
}

export interface ListFilesResponse {
  files: UploadedFileInfo[];
  count: number;
}

export function getUploadPreviewUrl(file: {
  artifact_url?: string;
  virtual_path?: string;
  path?: string;
}): string | null {
  const artifactUrl =
    typeof file.artifact_url === "string" ? file.artifact_url : "";
  if (artifactUrl) {
    if (artifactUrl.startsWith("http://") || artifactUrl.startsWith("https://")) {
      return artifactUrl;
    }
    return `${getBackendBaseURL()}${artifactUrl.startsWith("/") ? "" : "/"}${artifactUrl}`;
  }
  const virtualPath =
    typeof file.virtual_path === "string" ? file.virtual_path : "";
  if (virtualPath) {
    return `${getBackendBaseURL()}/api/threads${virtualPath.startsWith("/") ? "" : "/"}${virtualPath}`;
  }
  const path = typeof file.path === "string" ? file.path : "";
  if (path && (path.startsWith("http://") || path.startsWith("https://"))) {
    return path;
  }
  return null;
}

/**
 * Upload files to a thread
 */
export async function uploadFiles(
  threadId: string,
  files: File[],
): Promise<UploadResponse> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  return upload<UploadResponse>(
    `${getBackendBaseURL()}/api/threads/${threadId}/uploads`,
    formData,
  );
}

/**
 * List all uploaded files for a thread
 */
export async function listUploadedFiles(
  threadId: string,
): Promise<ListFilesResponse> {
  return request<ListFilesResponse>(
    `${getBackendBaseURL()}/api/threads/${threadId}/uploads/list`,
  );
}

/**
 * Delete an uploaded file
 */
export async function deleteUploadedFile(
  threadId: string,
  filename: string,
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `${getBackendBaseURL()}/api/threads/${threadId}/uploads/${filename}`,
    {
      method: "DELETE",
    },
  );
}
