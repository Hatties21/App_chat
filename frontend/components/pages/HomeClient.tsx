"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import SignOut from "@/components/auth/SignOut";

export default function HomeClient() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-6 space-y-4">
      <div>
        {user?.username || "loading..."}
      </div>
      <div>
        {user?.displayName || "loading..."}
      </div>
      <div>
        {user?.email || "loading..."}
      </div>
      <div>
        
      </div>
      <div>
        <SignOut />
      </div>
    </div>
  );
}
