import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { buttonVariants } from "@/components/ui/button";

export default function BuscarPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Buscar leads</h1>
          <p className="text-muted-foreground text-sm">Escolha nichos e cidade. A busca roda no Apify.</p>
        </div>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Voltar
        </Link>
      </header>
      <SearchForm />
    </main>
  );
}
