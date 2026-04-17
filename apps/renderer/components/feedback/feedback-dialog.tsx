"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { createFeedback } from "@/lib/api/feedback";
import { getApiErrorMessage } from "@/lib/request";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultContact?: string;
  threadId?: string | null;
};

type FeedbackFieldErrors = {
  title?: string;
  content?: string;
};

function RequiredMark() {
  return (
    <span className="ml-0.5 text-red-500" aria-hidden>
      *
    </span>
  );
}

function FieldError({ id, message }: { id?: string; message: string }) {
  return (
    <p
      id={id}
      className="pointer-events-none absolute top-full left-0 z-10 mt-1 max-w-full text-xs text-red-500"
      role="alert"
    >
      {message}
    </p>
  );
}

export function FeedbackDialog({
  open,
  onOpenChange,
  defaultContact = "",
  threadId = null,
}: FeedbackDialogProps) {
  const t = useTranslations("feedback.dialog");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState(defaultContact);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FeedbackFieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof FeedbackFieldErrors, boolean>>
  >({});

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setContent("");
    setContact(defaultContact);
    setSubmitting(false);
    setFieldErrors({});
    setTouchedFields({});
  }, [defaultContact, open]);

  const titleValue = title.trim();
  const contentValue = content.trim();
  const contactValue = contact.trim();

  const clearFieldError = (key: keyof FeedbackFieldErrors) => {
    setFieldErrors((prev) => {
      if (prev[key] == null) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleFieldBlur = (key: keyof FeedbackFieldErrors) => {
    setTouchedFields((prev) => ({ ...prev, [key]: true }));
    let message: string | undefined;
    if (key === "title" && !titleValue) {
      message = t("validation.titleRequired");
    }
    if (key === "content" && !contentValue) {
      message = t("validation.contentRequired");
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });
  };

  const handleSubmit = async () => {
    const nextErrors: FeedbackFieldErrors = {};
    if (!titleValue) nextErrors.title = t("validation.titleRequired");
    if (!contentValue) nextErrors.content = t("validation.contentRequired");

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setTouchedFields((prev) => ({
        ...prev,
        title: Boolean(nextErrors.title) || prev.title,
        content: Boolean(nextErrors.content) || prev.content,
      }));
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await createFeedback({
        title: titleValue,
        content: contentValue,
        contact: contactValue || null,
        thread_id: threadId,
      });
      toast.success(t("toast.submitSuccess"));
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("toast.submitFailed")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,720px)] w-[calc(100vw-2rem)] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="mb-0 shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-8">
          <div className="space-y-7">
          <div>
            <label
              htmlFor="feedback-title"
              className="mb-2 block text-sm font-medium leading-none"
            >
              {t("fields.title.label")}
              <RequiredMark />
            </label>
            <div className="relative">
              <Input
                id="feedback-title"
                value={title}
                aria-invalid={Boolean(touchedFields.title && fieldErrors.title)}
                aria-describedby={
                  touchedFields.title && fieldErrors.title
                    ? "feedback-title-error"
                    : undefined
                }
                placeholder={t("fields.title.placeholder")}
                className={cn(
                  "bg-muted/40",
                  touchedFields.title &&
                    fieldErrors.title &&
                    "border-destructive ring-1 ring-destructive/35",
                )}
                onChange={(event) => {
                  setTitle(event.target.value);
                  clearFieldError("title");
                }}
                onBlur={() => handleFieldBlur("title")}
              />
              {touchedFields.title && fieldErrors.title ? (
                <FieldError
                  id="feedback-title-error"
                  message={fieldErrors.title}
                />
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="feedback-content"
              className="mb-2 block text-sm font-medium leading-none"
            >
              {t("fields.content.label")}
              <RequiredMark />
            </label>
            <div className="relative">
              <Textarea
                id="feedback-content"
                rows={6}
                resizeMode="vertical"
                value={content}
                aria-invalid={Boolean(touchedFields.content && fieldErrors.content)}
                aria-describedby={
                  touchedFields.content && fieldErrors.content
                    ? "feedback-content-error"
                    : undefined
                }
                placeholder={t("fields.content.placeholder")}
                className={cn(
                  "min-h-[120px] bg-muted/40",
                  touchedFields.content &&
                    fieldErrors.content &&
                    "border-destructive ring-1 ring-destructive/35",
                )}
                onChange={(event) => {
                  setContent(event.target.value);
                  clearFieldError("content");
                }}
                onBlur={() => handleFieldBlur("content")}
              />
              {touchedFields.content && fieldErrors.content ? (
                <FieldError
                  id="feedback-content-error"
                  message={fieldErrors.content}
                />
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="feedback-contact"
              className="mb-2 block text-sm font-medium leading-none"
            >
              {t("fields.contact.label")}
            </label>
            <Input
              id="feedback-contact"
              value={contact}
              className="bg-muted/40"
              placeholder={t("fields.contact.placeholder")}
              onChange={(event) => setContact(event.target.value)}
            />
          </div>
          </div>
        </div>

        <DialogFooter className="mt-0 shrink-0 border-t px-6 py-5">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
