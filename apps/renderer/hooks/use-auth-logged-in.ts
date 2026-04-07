"use client";

import { useEffect, useState } from "react";

import { getAuthToken } from "@/lib/auth/session";

/**
 * 客户端登录态：与 `getAuthToken()` / localStorage 持久化一致。
 * `ready` 为 true 后 `isLoggedIn` 才可信（避免 SSR 与首帧误判）。
 */
export function useAuthLoggedIn() {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const sync = () => {
      setIsLoggedIn(getAuthToken() !== null);
    };
    sync();
    setReady(true);
    window.addEventListener("media-auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("media-auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { ready, isLoggedIn };
}
