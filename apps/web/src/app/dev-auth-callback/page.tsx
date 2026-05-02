"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Dev-only: reads Supabase implicit-flow tokens from the hash fragment,
// establishes the session, then redirects to the requested page.
// This page returns nothing useful in production.
function DevAuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const next = searchParams.get("next") ?? "/admin";

    if (!accessToken || !refreshToken) {
      router.push("/login?error=Dev+auth+failed");
      return;
    }

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          router.push("/login?error=Dev+auth+failed");
        } else {
          router.push(next);
        }
      });
  }, [router, searchParams]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#666" }}>
      Signing in (dev mode)...
    </div>
  );
}

export default function DevAuthCallback() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#666" }}>
        Signing in (dev mode)...
      </div>
    }>
      <DevAuthCallbackInner />
    </Suspense>
  );
}
