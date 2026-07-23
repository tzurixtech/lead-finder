import Link from "next/link";

type LeadListItem = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  neighborhood: string | null;
  phone: string | null;
  whatsapp: string | null;
  digital_label: string | null;
  rating: number | null;
  reviews_count: number | null;
  score: number | null;
  temperature: string | null;
  relevance: string | null;
};

const TEMP_CLASS: Record<string, string> = {
  QUENTE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  MORNO: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  FRIO: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
};

const RELEVANCE_CLASS: Record<string, string> = {
  ALTA: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  MEDIA: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  BAIXA: "bg-muted text-muted-foreground",
};

function Badge({ value, palette }: { value: string | null; palette: Record<string, string> }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${palette[value] ?? "bg-muted"}`}>
      {value}
    </span>
  );
}

export function LeadsTable({ leads }: { leads: LeadListItem[] }) {
  if (leads.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
        Nenhum lead encontrado com esses filtros.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-left">
          <tr>
            <th className="p-3 font-medium">Nome</th>
            <th className="p-3 font-medium">Cidade</th>
            <th className="p-3 font-medium">Situação</th>
            <th className="p-3 font-medium">Temp.</th>
            <th className="p-3 font-medium">Score</th>
            <th className="p-3 font-medium">Relev.</th>
            <th className="p-3 font-medium">Avaliações</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-muted/30 border-t">
              <td className="p-3">
                <Link href={`/lead/${lead.id}`} className="font-medium hover:underline">
                  {lead.name}
                </Link>
                <div className="text-muted-foreground text-xs">{lead.category ?? "—"}</div>
              </td>
              <td className="p-3">{lead.city ?? lead.neighborhood ?? "—"}</td>
              <td className="p-3">{lead.digital_label ?? "—"}</td>
              <td className="p-3">
                <Badge value={lead.temperature} palette={TEMP_CLASS} />
              </td>
              <td className="p-3 tabular-nums">{lead.score ?? "—"}</td>
              <td className="p-3">
                <Badge value={lead.relevance} palette={RELEVANCE_CLASS} />
              </td>
              <td className="p-3 tabular-nums">
                {lead.rating != null ? `${lead.rating} · ${lead.reviews_count ?? 0}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
