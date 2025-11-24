"use client";

import { useTokenExpiration } from "@/hooks/useTokenExpiration";

/**
 * Provider to monitor token expiration
 * Must be used in client component
 */
export function TokenExpirationProvider({ children }: { children: React.ReactNode }) {
  useTokenExpiration();
  return <>{children}</>;
}
