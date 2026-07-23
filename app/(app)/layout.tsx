import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile";

/**
 * Guard das rotas internas: sem perfil concluído, manda para o onboarding.
 * A personalização depende do business_profile existir.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile?.onboarding_done) {
    redirect("/onboarding");
  }
  return children;
}
