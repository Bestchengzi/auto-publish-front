import type { PublishEditResponse } from "@/lib/api/publish";

export type BeginArtifactPublishParams = {
  threadId: string;
  artifactPath: string;
  title: string;
  contentHtml: string;
  markdownSnapshot: string;
};

export type PublishPreviewPayload = BeginArtifactPublishParams & {
  selectedAccountIds: string[];
  publishEdit: PublishEditResponse;
};

export type PublishEditCacheEntry = {
  publishEdit: PublishEditResponse;
  markdownSnapshot: string;
};
