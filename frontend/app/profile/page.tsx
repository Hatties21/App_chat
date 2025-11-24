import ProtectedClient from "@/components/auth/ProtectedClient";
import ProfileClient from "@/components/pages/ProfileClient";

export default function ProfilePage() {
  return (
    <ProtectedClient>
      <ProfileClient />
    </ProtectedClient>
  );
}
