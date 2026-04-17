"use client";

import { useEffect } from "react";
import type { PageTitleInfo } from "@/lib/admin/derive-page-title";

/**
 * Mount this from any admin page to override the top bar's title/subtitle.
 * Uses a CustomEvent bridge so the top bar can listen without prop drilling.
 */
export function PageTitle(info: PageTitleInfo) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("admin:page-title", { detail: info }));
    return () => {
      window.dispatchEvent(new CustomEvent("admin:page-title", { detail: null }));
    };
  }, [info.title, info.subtitle, info.backHref, info.backLabel]);
  return null;
}
