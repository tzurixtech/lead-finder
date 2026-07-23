import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getKeyStatus } from "@/lib/keys";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/app/actions/profile";
import { ProfileForm } from "@/components/profile-form";
import { buttonVariants } from "@/components/ui/button";

export default async function PerfilPage() {
  const profile = await getProfile();
  if (!profile?.onboarding_done) {
    redirect("/onboarding");
  }
  const keyStatus = await getKeyStatus(await createClient());

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Perfil do negócio</h1>
          <p className="text-muted-foreground text-sm">Edite quando sua oferta mudar.</p>
        </div>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Voltar
        </Link>
      </header>
      <ProfileForm action={updateProfile} initial={profile} keyStatus={keyStatus} submitLabel="Salvar alterações" />
    </main>
  );
}
