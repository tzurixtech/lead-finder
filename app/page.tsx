import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tzurix LeadFinder</h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </header>
      <section className="text-muted-foreground rounded-lg border border-dashed p-10 text-center">
        Dashboard em construção. As próximas fases trarão perfil, buscas e leads.
      </section>
    </main>
  );
}
