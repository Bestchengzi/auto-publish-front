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
  allowedPublishPlatformIds?: string[] | null;
  previewVariant?: "rednote-image-cards";
  rednotePreview?: {
    images: string[];
    title: string;
    content: string;
  };
};

export type PublishEditCacheEntry = {
  publishEdit: PublishEditResponse;
  markdownSnapshot: string;
};

export type BeginDirectPublishParams = BeginArtifactPublishParams & {
  allowedPlatformIds?: string[] | null;
  allowedPublishPlatformIds?: string[] | null;
  createPublishEdit: (
    selectedAccountIds: string[],
  ) => PublishEditResponse | Promise<PublishEditResponse>;
  previewVariant?: PublishPreviewPayload["previewVariant"];
  rednotePreview?: PublishPreviewPayload["rednotePreview"];
};
