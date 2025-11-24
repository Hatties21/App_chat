"use client";

import { useParams } from "next/navigation";
import ProtectedClient from "@/components/auth/ProtectedClient";
import UserProfileClient from "@/components/pages/UserProfileClient";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.userId as string;

  console.log("UserProfilePage - params:", params, "userId:", userId);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <ProtectedClient>
      <UserProfileClient userId={userId} />
    </ProtectedClient>
  );
}
