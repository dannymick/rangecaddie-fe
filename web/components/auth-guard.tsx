"use client";

import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getAccessToken } from "@/lib/auth";

const ALLOWLIST_PREFIXES = ["/login", "/signup"];

export function AuthGuard({ children }: PropsWithChildren) {
  const pathname = usePathname() || "/";
  const search = useSearchParams();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const isPublic = useMemo(() => {
    return ALLOWLIST_PREFIXES.some((p) => pathname.startsWith(p));
  }, [pathname]);

  useEffect(() => {
    // Defer to client to read localStorage
    if (isPublic) {
      setReady(true);
      return;
    }
    const has = !!getAccessToken();
    if (!has) {
      const q = search?.toString();
      const next = pathname + (q ? `?${q}` : "");
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setReady(true);
  }, [isPublic, pathname, search, router]);

  if (!ready) return null;
  return <>{children}</>;
}

