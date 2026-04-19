"use client";

import { PublishAccountsDrawer } from "../accounts/publish-accounts-drawer";
import { usePublishFlow } from "./publish-flow-provider";
import { PublishOverlay } from "./publish-overlay";

export function PublishFlowUi() {
  const {
    confirmPublishAccounts,
    publishAccountsOpen,
    publishPreview,
    closePublishPreview,
    setPublishAccountsOpen,
  } = usePublishFlow();

  return (
    <>
      <PublishAccountsDrawer
        open={publishAccountsOpen}
        onOpenChange={setPublishAccountsOpen}
        onConfirm={confirmPublishAccounts}
      />
      <PublishOverlay
        publishPreview={publishPreview}
        closePublishPreview={closePublishPreview}
      />
    </>
  );
}
