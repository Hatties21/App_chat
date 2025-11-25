"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Loader2 } from "lucide-react";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchMe, setAccessToken } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      console.log("=== OAuth Callback ===");
      console.log("Token:", token ? "✓ Received" : "✗ Missing");
      console.log("Error:", error || "None");
      console.log("Full URL:", window.location.href);

      if (error) {
        // OAuth failed
        console.error("OAuth error:", error);
        router.push(`/signin?error=${error}`);
        return;
      }

      if (token) {
        // Store token using store method
        console.log("Storing token...");
        setAccessToken(token);
        
        // Fetch user data
        try {
          console.log("Fetching user data...");
          await fetchMe();
          console.log("✓ Login successful! Redirecting to home...");
          // Redirect to home
          router.push("/");
        } catch (error) {
          console.error("Failed to fetch user:", error);
          setAccessToken(null);
          router.push("/signin?error=fetch_failed");
        }
      } else {
        // No token, redirect to signin
        console.warn("No token received, redirecting to signin");
        router.push("/signin");
      }
    };

    handleCallback();
  }, [searchParams, router, fetchMe]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Đang đăng nhập...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
