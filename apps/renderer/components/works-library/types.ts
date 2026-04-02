import type { PlatformId } from "@/components/account-management/types";

export type PublishStatus = "success" | "failed" | "publishing";

export type Work = {
  id: string;
  title: string;
  platformIds: PlatformId[];
  createdAt: string;
  status: PublishStatus;
  successCount: number;
  failedCount: number;
};
