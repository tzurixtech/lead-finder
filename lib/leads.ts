// lib/leads.ts
// Filtros e consulta de leads, compartilhados entre dashboard, API e export.
import type { SupabaseClient } from "@supabase/supabase-js";

export const TEMPERATURES = ["QUENTE", "MORNO", "FRIO"] as const;
export const RELEVANCES = ["ALTA", "MEDIA", "BAIXA"] as const;
export const DIGITAL_STATUSES = ["SEM_SITE", "SITE_FRACO", "SITE_PROPRIO"] as const;

export const PAGE_SIZE = 20;

export const LEAD_STAGES = ["Novo", "Contatado", "Negociando", "Fechado", "Perdido"] as const;

export interface LeadRow {
  id: string;
  name: string;
  category: string | null;
  neighborhood: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  digital_status: string | null;
  digital_label: string | null;
  rating: number | null;
  reviews_count: number | null;
  score: number | null;
  temperature: string | null;
  ticket: string | null;
  suggested_package: string | null;
  reason: string | null;
  stage: string | null;
  notes: string | null;
  relevance: string | null;
  diagnosis: string | null;
  opening_message: string | null;
  personalized: boolean;
}

/** Colunas para a tabela do dashboard. */
export const LIST_COLUMNS =
  "id, name, category, city, neighborhood, phone, whatsapp, digital_label, rating, reviews_count, score, temperature, relevance";

/** Colunas para o CSV de export. */
export const EXPORT_COLUMNS =
  "name, category, city, neighborhood, phone, whatsapp, website, digital_label, rating, reviews_count, score, temperature, ticket, relevance, suggested_package";

export interface LeadFilters {
  temperature: string | null;
  relevance: string | null;
  digital_status: string | null;
  category: string | null;
  city: string | null;
  search: string | null;
}

export type RawParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string | null {
  const text = Array.isArray(value) ? value[0] : value;
  const trimmed = (text ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function oneOf(value: string | null, allowed: ReadonlyArray<string>): string | null {
  return value && allowed.includes(value) ? value : null;
}

export function parseLeadFilters(params: RawParams): LeadFilters {
  return {
    temperature: oneOf(single(params.temperature), TEMPERATURES),
    relevance: oneOf(single(params.relevance), RELEVANCES),
    digital_status: oneOf(single(params.digital_status), DIGITAL_STATUSES),
    category: single(params.category),
    city: single(params.city),
    search: single(params.search),
  };
}

export function parsePage(params: RawParams): number {
  const raw = Number(single(params.page) ?? "1");
  return Number.isFinite(raw) && raw >= 1 ? Math.trunc(raw) : 1;
}

/** Serializa os filtros de volta para query string (mantém filtros em links). */
export function filtersToQuery(filters: LeadFilters): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  return query.toString();
}

interface QueryOptions {
  columns?: string;
  count?: boolean;
}

/** Monta a query de leads do usuário aplicando os filtros. */
export function leadsQuery(supabase: SupabaseClient, filters: LeadFilters, options: QueryOptions = {}) {
  const { columns = "*", count = false } = options;
  let query = count
    ? supabase.from("leads").select(columns, { count: "exact", head: true })
    : supabase.from("leads").select(columns);

  if (filters.temperature) query = query.eq("temperature", filters.temperature);
  if (filters.relevance) query = query.eq("relevance", filters.relevance);
  if (filters.digital_status) query = query.eq("digital_status", filters.digital_status);
  if (filters.category) query = query.ilike("category", `%${filters.category}%`);
  if (filters.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);

  return query;
}
