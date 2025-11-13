import ProtectedClient from "@/components/auth/ProtectedClient";
import HomeClient from "@/components/pages/HomeClient";

export default function Home() {
  return (
    <ProtectedClient>
      <HomeClient />
    </ProtectedClient>
  );
}