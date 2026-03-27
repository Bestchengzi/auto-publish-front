import * as React from "react";
import { toast } from "sonner";
import { getDesktop } from "@/lib/desktop-api";
import { getApiErrorMessage } from "@/lib/request";
import * as accountsApi from "@/lib/api/accounts";

type TFn = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

type UsePlatformAuthSyncArgs = {
  t: TFn;
  refreshData: () => Promise<void>;
};

export function usePlatformAuthSync({ t, refreshData }: UsePlatformAuthSyncArgs) {
  React.useEffect(() => {
    const desktop = getDesktop();
    if (!desktop?.externalTab?.onPlatformAuthCompleted) return;
    const off = desktop.externalTab.onPlatformAuthCompleted(
      async (_tabId, res) => {
        if (!res.ok) {
          if (res.error === "cancelled") return;
          if (res.error === "busy") toast.error(t("account.addAccount.authBusy"));
          else if (res.error === "unsupported")
            toast.error(t("account.addAccount.authUnsupported"));
          else {
            const msg = (res.message ?? "").slice(0, 200);
            toast.error(t("account.addAccount.authFailed", { message: msg || "—" }));
          }
          return;
        }
        try {
          const cookieJson = JSON.stringify(res.cookies);
          await accountsApi.createAccountFromAuth({
            cookie: cookieJson,
            platform: res.platformId,
          });
          toast.success(t("account.addAccount.authSuccess"));
          await refreshData();
        } catch (e) {
          console.error("Failed to create account from auth:", e);
          toast.error(getApiErrorMessage(e, t("account.addAccount.authFailed")));
        }
      },
    );
    return off;
  }, [refreshData, t]);
}
