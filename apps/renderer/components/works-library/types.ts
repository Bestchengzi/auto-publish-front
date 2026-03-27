import type { PlatformId } from "@/components/account-management/types";

export type WorkType = "video" | "image" | "text";

export type PublishStatus = "success" | "failed" | "publishing";

export type Work = {
  id: string;
  title: string;
  type: WorkType;
  platformIds: PlatformId[];
  createdAt: string;
  status: PublishStatus;
  successCount: number;
  failedCount: number;
  isDraft: boolean;
};
