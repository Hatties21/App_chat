"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  const { user, loading, bootstrap } = useAuthStore();

  useEffect(() => {
    // run once on mount to initialize from cookie/localStorage
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="p-6">Đang kiểm tra phiên đăng nhập...</div>;
  }
  return <>{children}</>;
}
