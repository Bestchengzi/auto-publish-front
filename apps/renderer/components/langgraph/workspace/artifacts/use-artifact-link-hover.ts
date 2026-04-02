import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  normalizeAndValidateUrl,
  runHoverLinkCommand,
} from "./artifact-url-utils";

export function useArtifactLinkHover(editor: Editor | null) {
  const linkHoverAnchorRef = useRef<HTMLElement | null>(null);
  const linkHoverCardRef = useRef<HTMLDivElement | null>(null);
  const linkHoverHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const linkHoverPointerRafRef = useRef<number | null>(null);

  const [linkHoverOpen, setLinkHoverOpen] = useState(false);
  const [linkHoverHref, setLinkHoverHref] = useState("");
  const [linkHoverEditing, setLinkHoverEditing] = useState(false);
  const [linkHoverDraft, setLinkHoverDraft] = useState("");

  const clearLinkHoverHideTimer = useCallback(() => {
    if (linkHoverHideTimerRef.current != null) {
      clearTimeout(linkHoverHideTimerRef.current);
      linkHoverHideTimerRef.current = null;
    }
  }, []);

  const hideLinkHoverCard = useCallback(() => {
    clearLinkHoverHideTimer();
    linkHoverAnchorRef.current = null;
    setLinkHoverOpen(false);
    setLinkHoverEditing(false);
    setLinkHoverDraft("");
    setLinkHoverHref("");
  }, [clearLinkHoverHideTimer]);

  const scheduleHideLinkHover = useCallback(() => {
    if (linkHoverHideTimerRef.current != null) return;
    linkHoverHideTimerRef.current = setTimeout(() => {
      linkHoverHideTimerRef.current = null;
      hideLinkHoverCard();
    }, 200);
  }, [hideLinkHoverCard]);

  const showLinkHoverForAnchor = useCallback(
    (a: HTMLAnchorElement) => {
      if (!editor?.isEditable) return;
      clearLinkHoverHideTimer();
      linkHoverAnchorRef.current = a;
      const href = a.getAttribute("href") ?? "";
      setLinkHoverHref(href);
      setLinkHoverDraft(href);
      setLinkHoverEditing(false);
      setLinkHoverOpen(true);
    },
    [editor, clearLinkHoverHideTimer],
  );

  const unlinkLinkFromHover = useCallback(() => {
    if (!editor || !linkHoverAnchorRef.current) return;
    runHoverLinkCommand(editor, linkHoverAnchorRef.current, "unset");
    hideLinkHoverCard();
  }, [editor, hideLinkHoverCard]);

  const applyLinkEditFromHover = useCallback(() => {
    if (!editor || !linkHoverAnchorRef.current) return;
    const a = linkHoverAnchorRef.current;
    const url = linkHoverDraft.trim();
    if (!url) {
      runHoverLinkCommand(editor, a, "unset");
      hideLinkHoverCard();
      return;
    }
    const validatedUrl = normalizeAndValidateUrl(url);
    if (!validatedUrl) {
      toast.error("请输入有效的网址");
      return;
    }
    runHoverLinkCommand(editor, a, { href: validatedUrl });
    hideLinkHoverCard();
  }, [editor, linkHoverDraft, hideLinkHoverCard]);

  useEffect(() => {
    if (!editor) return;
    const edDom = editor.view.dom;

    const syncHoverFromPoint = (clientX: number, clientY: number) => {
      if (!editor.isEditable) {
        scheduleHideLinkHover();
        return;
      }
      const at = document.elementFromPoint(clientX, clientY);
      if (linkHoverCardRef.current?.contains(at)) {
        clearLinkHoverHideTimer();
        return;
      }
      const a =
        at instanceof Element ? at.closest("a[href]") : null;
      if (a instanceof HTMLAnchorElement && edDom.contains(a)) {
        showLinkHoverForAnchor(a);
      } else {
        scheduleHideLinkHover();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (linkHoverPointerRafRef.current != null) {
        cancelAnimationFrame(linkHoverPointerRafRef.current);
      }
      linkHoverPointerRafRef.current = requestAnimationFrame(() => {
        linkHoverPointerRafRef.current = null;
        syncHoverFromPoint(e.clientX, e.clientY);
      });
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      if (linkHoverPointerRafRef.current != null) {
        cancelAnimationFrame(linkHoverPointerRafRef.current);
        linkHoverPointerRafRef.current = null;
      }
    };
  }, [
    editor,
    showLinkHoverForAnchor,
    scheduleHideLinkHover,
    clearLinkHoverHideTimer,
  ]);

  return {
    linkHoverAnchorRef,
    linkHoverCardRef,
    linkHoverOpen,
    hideLinkHoverCard,
    clearLinkHoverHideTimer,
    scheduleHideLinkHover,
    linkHoverHref,
    linkHoverEditing,
    linkHoverDraft,
    setLinkHoverDraft,
    setLinkHoverEditing,
    unlinkLinkFromHover,
    applyLinkEditFromHover,
  };
}

export type ArtifactLinkHoverControls = ReturnType<
  typeof useArtifactLinkHover
>;
