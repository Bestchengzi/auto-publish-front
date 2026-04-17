import type { PlatformId } from "@/components/account-management/types";

export type PublishStatus = "success" | "failed" | "publishing";
export type PublishTriggerType = "manual" | "dialog" | "unknown";
export type PublishFailureLog = {
  accountId: string;
  accountName: string;
  platform: string;
  reason: string;
};

export type WorkPublishAccount = {
  accountId: string;
  accountName: string;
  avatarUrl: string | null;
  platform: string;
  success: boolean;
  publishedUrl: string | null;
  errorMessage: string;
};

export type Work = {
  id: string;
  title: string;
  platformIds: PlatformId[];
  createdAt: string;
  publishType: PublishTriggerType;
  status: PublishStatus;
  successCount: number;
  failedCount: number;
  failedLogs: PublishFailureLog[];
  publishAccounts: WorkPublishAccount[];
};
