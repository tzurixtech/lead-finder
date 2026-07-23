import Link from "next/link";
import {
  TEMPERATURES,
  RELEVANCES,
  DIGITAL_STATUSES,
  filtersToQuery,
  type LeadFilters,
} from "@/lib/leads";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SELECT_CLASS =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3";

const DIGITAL_LABELS: Record<string, string> = {
  SEM_SITE: "Sem site",
  SITE_FRACO: "Site fraco",
  SITE_PROPRIO: "Site próprio",
};

export function LeadFiltersForm({ filters }: { filters: LeadFilters }) {
  const exportQuery = filtersToQuery(filters);
  return (
    <form method="get" action="/" className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1">
        <Label htmlFor="f-search">Texto (nome)</Label>
        <Input id="f-search" name="search" defaultValue={filters.search ?? ""} placeholder="Ex.: pizzaria" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="f-city">Cidade</Label>
        <Input id="f-city" name="city" defaultValue={filters.city ?? ""} placeholder="Ex.: São Vicente" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="f-category">Categoria</Label>
        <Input id="f-category" name="category" defaultValue={filters.category ?? ""} placeholder="Ex.: dentista" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="f-temperature">Temperatura</Label>
        <select id="f-temperature" name="temperature" defaultValue={filters.temperature ?? ""} className={SELECT_CLASS}>
          <option value="">Todas</option>
          {TEMPERATURES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="f-relevance">Relevância</Label>
        <select id="f-relevance" name="relevance" defaultValue={filters.relevance ?? ""} className={SELECT_CLASS}>
          <option value="">Todas</option>
          {RELEVANCES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="f-digital">Situação digital</Label>
        <select id="f-digital" name="digital_status" defaultValue={filters.digital_status ?? ""} className={SELECT_CLASS}>
          <option value="">Todas</option>
          {DIGITAL_STATUSES.map((value) => (
            <option key={value} value={value}>
              {DIGITAL_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
        <Button type="submit">Filtrar</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Limpar
        </Link>
        <a
          href={`/api/leads/export${exportQuery ? `?${exportQuery}` : ""}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Exportar CSV
        </a>
      </div>
    </form>
  );
}
