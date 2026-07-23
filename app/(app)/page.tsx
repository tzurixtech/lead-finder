import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadFiltersForm } from "@/components/lead-filters";
import { LeadsTable } from "@/components/leads-table";
import {
  parseLeadFilters,
  parsePage,
  leadsQuery,
  filtersToQuery,
  LIST_COLUMNS,
  PAGE_SIZE,
  type RawParams,
} from "@/lib/leads";

async function countLeads(
  supabase: Awaited<ReturnType<typeof createClient>>,
  column?: string,
  value?: string,
): Promise<number> {
  let query = supabase.from("leads").select("id", { count: "exact", head: true });
  if (column && value) query = query.eq(column, value);
  const { count } = await query;
  return count ?? 0;
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const filters = parseLeadFilters(params);
  const page = parsePage(params);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [total, quentes, altaRelevancia, semSite] = await Promise.all([
    countLeads(supabase),
    countLeads(supabase, "temperature", "QUENTE"),
    countLeads(supabase, "relevance", "ALTA"),
    countLeads(supabase, "digital_status", "SEM_SITE"),
  ]);

  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await leadsQuery(supabase, filters, { columns: LIST_COLUMNS })
    .order("score", { ascending: false, nullsFirst: false })
    .range(from, from + PAGE_SIZE - 1);

  const leads = (data ?? []) as unknown as Parameters<typeof LeadsTable>[0]["leads"];
  const filtered = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(filtered / PAGE_SIZE));
  const query = filtersToQuery(filters);
  const pageLink = (target: number) => `/?${query ? `${query}&` : ""}page=${target}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tzurix LeadFinder</h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/buscar" className={buttonVariants()}>
            Buscar leads
          </Link>
          <Link href="/perfil" className={buttonVariants({ variant: "outline" })}>
            Perfil
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sair
            </Button>
          </form>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total de leads" value={total} />
        <Kpi label="Quentes" value={quentes} />
        <Kpi label="Alta relevância" value={altaRelevancia} />
        <Kpi label="Sem site" value={semSite} />
      </section>

      <LeadFiltersForm filters={filters} />

      <LeadsTable leads={leads} />

      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <span>
          {filtered} lead(s) · página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={pageLink(page - 1)} className={buttonVariants({ variant: "outline" })}>
              Anterior
            </Link>
          )}
          {page < totalPages && (
            <Link href={pageLink(page + 1)} className={buttonVariants({ variant: "outline" })}>
              Próxima
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
