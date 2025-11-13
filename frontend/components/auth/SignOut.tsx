"use client";

import { Button } from "../ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

export default function SignOut() {
  const signOut = useAuthStore((s) => s.signOut);
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Đăng xuất thành công!");
      window.location.href = "/signin";
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Đăng xuất thất bại, vui lòng thử lại."
      );
    }
  };
  return (
    <Button variant="outline" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}
