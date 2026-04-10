"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import {
  fetchUserScanStatus,
  getWechatParamQrcode,
  type WechatScanTokenResponse,
} from "@/lib/api/auth";
import { clearAuthRelatedQueryCache } from "@/lib/auth/query-cache";
import { setPersistedAuthSession } from "@/lib/auth/session";
import { getApiErrorMessage } from "@/lib/request";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess?: () => void;
}

function WeChatQRContent({
  onLoginSuccess,
}: {
  onLoginSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const t = useTranslations("auth.loginDialog");
  const locale = useLocale();
  const legalLocale = locale === "en" ? "en" : "zh-CN";
  const legalUserHref = `/${legalLocale}/site/terms`;
  const legalPrivacyHref = `/${legalLocale}/site/privacy`;
  const [qrcodeUrl, setQrcodeUrl] = useState("");
  const [ticket, setTicket] = useState("");
  const [status, setStatus] = useState<"loading" | "pending" | "expired">(
    "loading",
  );
  const [, setCountdown] = useState(120);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const completeLogin = useCallback(
    (userResponse: WechatScanTokenResponse) => {
      const displayName = userResponse.name ?? userResponse.id;
      setPersistedAuthSession(userResponse.access_token, {
        id: userResponse.id,
        name: displayName,
        phone: userResponse.phone,
        create_at: userResponse.create_at,
        update_at: userResponse.update_at,
        three_party_identities: userResponse.three_party_identities,
      });
      clearAuthRelatedQueryCache(queryClient);
      onLoginSuccess();
    },
    [onLoginSuccess, queryClient],
  );

  const fetchQRCode = useCallback(async () => {
    try {
      setStatus("loading");
      const data = await getWechatParamQrcode();
      setQrcodeUrl(data.url);
      setTicket(data.id);
      setStatus("pending");
      setCountdown(data.expire_in);
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, t("qrcodeLoadFailed")));
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        retryTimeoutRef.current = null;
        void fetchQRCode();
      }, 1000);
    }
  }, [t]);

  useEffect(() => {
    if (status === "loading" && !qrcodeUrl) {
      void fetchQRCode();
    }
  }, [status, qrcodeUrl, fetchQRCode]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (status !== "pending" || !ticket) return;

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus("expired");
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollingIntervalRef.current = setInterval(() => {
      void (async () => {
        try {
          const userResponse = await fetchUserScanStatus(ticket);
          if (userResponse) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            completeLogin(userResponse);
          }
        } catch (e) {
          console.error(e);
        }
      })();
    }, 2000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [status, ticket, completeLogin]);

  const handleRefresh = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setQrcodeUrl("");
    setStatus("loading");
  };

  return (
    <div className="flex min-h-[320px] w-full min-w-0 flex-col items-center px-6 pb-6">
      {status === "loading" && (
        <div className="flex h-52 w-52 flex-col items-center justify-center rounded-2xl bg-muted/50 dark:bg-muted/30">
          <div className="mb-3 size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <div className="text-sm text-muted-foreground">{t("loading")}</div>
        </div>
      )}
      {status === "pending" && (
        <div className="relative rounded-2xl border border-border bg-background p-3 dark:bg-card/80">
          {qrcodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- 微信二维码域名为第三方，避免配置 remotePatterns
            <img
              src={qrcodeUrl}
              alt=""
              width={208}
              height={208}
              className="size-52 rounded-lg object-contain"
            />
          ) : null}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-primary/80 px-3 py-1 text-xs font-medium text-primary-foreground">
            {t("wechatScanBadge")}
          </div>
        </div>
      )}
      {status === "expired" && (
        <button
          type="button"
          onClick={handleRefresh}
          className="flex h-52 w-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-muted-foreground/50 dark:bg-muted/20"
        >
          <RefreshCw className="mb-3 size-10 text-primary" />
          <div className="mb-1 font-medium text-foreground">
            {t("qrcodeExpired")}
          </div>
          <div className="text-sm text-muted-foreground">
            {t("tapToRefresh")}
          </div>
        </button>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("agreePrefix")}
        <a
          href={legalUserHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-0.5 text-primary hover:underline"
        >
          {t("userAgreement")}
        </a>
        {t("agreeMiddle")}
        <a
          href={legalPrivacyHref}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-0.5 text-primary hover:underline"
        >
          {t("privacyPolicy")}
        </a>
      </p>
    </div>
  );
}

export function LoginDialog({
  open,
  onOpenChange,
  onLoginSuccess,
}: LoginDialogProps) {
  const t = useTranslations("auth.loginDialog");
  const [session, setSession] = useState(0);

  useEffect(() => {
    if (open) setSession((s) => s + 1);
  }, [open]);

  const handleLoginSuccess = () => {
    onLoginSuccess?.();
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "w-[384px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0",
        )}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 cursor-pointer rounded-md p-1 outline-none transition-colors hover:bg-muted focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          aria-label={t("close")}
        >
          <span className="sr-only">{t("close")}</span>
          <X className="size-5 text-muted-foreground" aria-hidden />
        </button>

        {/* Tab 底边：1px 线与选中条对齐；分隔线左右留白（与内容 px-6 一致），不占满整宽 */}
        <div className="relative pt-4">
          <div className="px-6">
            <div className="flex items-center gap-6">
              <div className="relative px-1 py-[10px] text-base font-medium text-foreground">
                {t("tabQrcode")}
                <span
                  className="absolute bottom-0 left-0 right-0 z-10 h-0.5 bg-primary"
                  aria-hidden
                />
              </div>
            </div>
          </div>
          <div
            className="pointer-events-none absolute right-6 bottom-0 left-6 h-px bg-border"
            aria-hidden
          />
        </div>

        <div className="flex w-full min-w-0 flex-col pt-6">
          <WeChatQRContent
            key={session}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
