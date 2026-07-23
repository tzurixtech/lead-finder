import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { completeOnboarding } from "@/app/actions/profile";
import { ProfileForm } from "@/components/profile-form";

export default async function OnboardingPage() {
  const profile = await getProfile();
  if (profile?.onboarding_done) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Bem-vindo à Tzurix LeadFinder</h1>
        <p className="text-muted-foreground text-sm">
          Descreva seu negócio. É o que personaliza a qualificação e as mensagens de cada lead.
        </p>
      </header>
      <ProfileForm action={completeOnboarding} initial={profile} submitLabel="Concluir e acessar" />
    </main>
  );
}
