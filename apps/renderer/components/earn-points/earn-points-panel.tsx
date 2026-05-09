"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRightIcon,
  CopyIcon,
  HeadphonesIcon,
  LinkIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthLoggedIn } from "@/hooks/use-auth-logged-in";
import { getBillingAccount, getBillingInviteSummary } from "@/lib/api/billing";
import { getAuthUser } from "@/lib/auth/session";
import { formatBillingPoints } from "@/lib/billing-points";

const inviteCodeStorageKey = "media-billing-invite-code";

function getThreadIdFromPathname(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[1] !== "creation-center") return null;
  const threadId = segments[2];
  if (!threadId || threadId === "new") return null;
  return decodeURIComponent(threadId);
}

export function EarnPointsPanel() {
  const pathname = usePathname();
  const locale = useLocale();
  const tDialog = useTranslations("sidebar.footer.earnPointsDialog");
  const tPage = useTranslations("earnPointsPage");
  const { ready, isLoggedIn } = useAuthLoggedIn();
  const [inviteCode, setInviteCode] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const userPhone = getAuthUser()?.phone?.trim() ?? "";
  const feedbackThreadId = getThreadIdFromPathname(pathname);
  const localeSegment = pathname.split("/").filter(Boolean)[0];
  const appLocale = localeSegment === "en" ? "en" : "zh-CN";
  const { data: billingAccount } = useQuery({
    queryKey: ["billing", "account"],
    queryFn: getBillingAccount,
    enabled: ready && isLoggedIn,
    staleTime: 20_000,
  });

  const {
    data: inviteSummaryEnvelope,
    isPending: inviteSummaryPending,
    isError: inviteSummaryError,
  } = useQuery({
    queryKey: ["billing", "invite-summary"],
    queryFn: getBillingInviteSummary,
    enabled: ready && isLoggedIn,
    staleTime: 20_000,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = window.localStorage.getItem(inviteCodeStorageKey);
    if (cached && cached.trim().length > 0) {
      setInviteCode(cached.trim());
    }
  }, []);

  useEffect(() => {
    const next = billingAccount?.account.invite_code?.trim() ?? "";
    if (next.length === 0) return;
    setInviteCode(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(inviteCodeStorageKey, next);
    }
  }, [billingAccount]);

  const inviteCodeForLink =
    (billingAccount?.account.invite_code?.trim() ||
      inviteSummaryEnvelope?.invite_summary.invite_code?.trim() ||
      inviteCode.trim()) ||
    "";

  const inviteLink =
    typeof window !== "undefined" && inviteCodeForLink.length > 0
      ? `${window.location.origin}/${appLocale}/creation-center/new?invite=${encodeURIComponent(inviteCodeForLink)}`
      : "";

  const summary = inviteSummaryEnvelope?.invite_summary;
  const invitedCount = summary?.invited_user_count ?? 0;
  const rewardedPointsRaw = summary?.rewarded_points ?? 0;
  const localeTag = locale === "en" ? "en-US" : "zh-CN";

  const showStatsLoading = ready && isLoggedIn && inviteSummaryPending;
  const showStatsData = ready && isLoggedIn && !inviteSummaryPending && !inviteSummaryError && summary;
  const invitedDisplay = !ready || !isLoggedIn
    ? "—"
    : inviteSummaryError
      ? "—"
      : showStatsLoading
        ? ""
        : invitedCount.toLocaleString(localeTag);
  const pointsDisplay = !ready || !isLoggedIn
    ? "—"
    : inviteSummaryError
      ? "—"
      : showStatsLoading
        ? ""
        : formatBillingPoints(rewardedPointsRaw, locale);

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="space-y-3 text-center lg:text-left">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {tDialog("title")}
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base lg:mx-0">
            {tPage("heroSubtitle")}
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/80 bg-card shadow-sm">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {tPage("stats.invitedLabel")}
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UsersIcon className="size-4" aria-hidden />
                </div>
              </div>
              <div className="text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
                {showStatsLoading ? (
                  <Skeleton className="h-9 w-20 sm:h-10" />
                ) : (
                  invitedDisplay
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {inviteSummaryError
                  ? tPage("stats.loadError")
                  : showStatsData
                    ? tPage("stats.dataHint")
                    : null}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card shadow-sm">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {tPage("stats.pointsLabel")}
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <WalletIcon className="size-4" aria-hidden />
                </div>
              </div>
              {showStatsLoading ? (
                <Skeleton className="h-9 w-28 sm:h-10" />
              ) : (
                <div className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-3xl font-bold tabular-nums text-transparent sm:text-4xl">
                  {pointsDisplay}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {inviteSummaryError
                  ? tPage("stats.loadError")
                  : showStatsData
                    ? tPage("stats.dataHint")
                    : null}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <Card className="flex h-full min-h-0 flex-col overflow-hidden border-border shadow-sm">
            <CardContent className="flex min-h-0 flex-1 flex-col gap-5 p-5 sm:p-6">
              <div className="border-b border-border/60 pb-4">
                <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <LinkIcon className="size-4" aria-hidden />
                  </div>
                  {tDialog("shareTitle")}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {tDialog("description")}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="break-all rounded-md border border-border bg-background px-3 py-2.5 font-mono text-[11px] leading-snug text-muted-foreground sm:text-xs">
                  {inviteLink || tDialog("emptyInviteCode")}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3 w-full gap-1.5 sm:w-auto"
                  disabled={!inviteLink}
                  onClick={async () => {
                    if (!inviteLink) return;
                    try {
                      await navigator.clipboard.writeText(inviteLink);
                      toast.success(tDialog("copySuccess"));
                    } catch {
                      toast.error(tDialog("copyFailed"));
                    }
                  }}
                >
                  <CopyIcon className="size-4" />
                  {tDialog("copy")}
                </Button>
              </div>

              <div className="min-h-0 flex-1 space-y-3">
                <div className="text-sm font-semibold text-foreground">{tDialog("stepsTitle")}</div>
                <ol className="space-y-2.5">
                  {(["step1", "step2", "step3"] as const).map((stepKey, index) => (
                    <li
                      key={stepKey}
                      className="flex gap-3 rounded-lg border border-border bg-background/80 p-3"
                    >
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {tDialog(`${stepKey}.title`)}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {tDialog(`${stepKey}.description`)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card className="flex h-full min-h-0 flex-col overflow-hidden border-primary/25 bg-card shadow-sm">
            <CardContent className="flex min-h-0 flex-1 flex-col gap-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4">
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                  {tPage("bounty.eyebrow")}
                </span>
                <h2 className="text-lg font-semibold text-foreground">{tPage("bounty.title")}</h2>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {tPage("bounty.description", { points: tPage("bounty.pointsToken") })}
              </p>
              <ul className="space-y-2 text-sm text-foreground/90">
                <li className="flex gap-2">
                  <ArrowRightIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{tPage("bounty.bullet1")}</span>
                </li>
                <li className="flex gap-2">
                  <ArrowRightIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{tPage("bounty.bullet2")}</span>
                </li>
              </ul>

              <Button
                type="button"
                className="w-full gap-2"
                onClick={() => setFeedbackOpen(true)}
              >
                {tPage("bounty.feedbackCta")}
                <ArrowRightIcon className="size-4" />
              </Button>

              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-border bg-muted/20 px-4 py-6 text-center">
                <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                  <HeadphonesIcon className="size-4 shrink-0 text-primary" aria-hidden />
                  {tPage("bounty.wechatTitle")}
                </div>
                <div className="relative size-40 overflow-hidden rounded-lg border border-border bg-background p-1.5 shadow-sm">
                  <Image
                    src="/erweima.webp"
                    alt={tPage("bounty.wechatAlt")}
                    fill
                    sizes="160px"
                    className="object-contain"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        defaultContact={userPhone}
        threadId={feedbackThreadId}
      />
    </div>
  );
}
