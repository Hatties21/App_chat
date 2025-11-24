"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import ProtectedClient from "@/components/auth/ProtectedClient";
import UserProfileClient from "@/components/pages/UserProfileClient";

export default function UserProfilePageClient() {
  const params = useParams();
  const userId = params.userId as string;

  useEffect(() => {
    console.log("Client page - userId:", userId);
  }, [userId]);

  if (!userId) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedClient>
      <UserProfileClient userId={userId} />
    </ProtectedClient>
  );
}
