// lib/search.ts
// Processamento de uma busca: lê o dataset do Apify, pontua, respeita exclusões,
// deduplica por (user_id, place_id) e insere os leads novos. Só servidor.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRunState, getDatasetItems, isRunFinished, isRunSuccess } from "@/lib/apify";
import { scoreAndFilter, type ScoredLead } from "@/lib/scoring";

export { COST_PER_PLACE_USD, estimateCostUsd } from "@/lib/cost";

export type SearchStatus = "pending" | "running" | "processing" | "done" | "error";

export interface SearchRow {
  id: string;
  user_id: string;
  status: SearchStatus;
  apify_run_id: string | null;
  apify_dataset_id: string | null;
  niches: string[];
  city: string;
  max_per_niche: number;
  total_found: number | null;
  total_new: number | null;
  cost_usd: number | null;
  error_message: string | null;
}

export interface SearchProgress {
  status: SearchStatus;
  totalFound: number;
  totalNew: number;
  costUsd: number;
  error: string | null;
}

function progressFromRow(row: SearchRow): SearchProgress {
  return {
    status: row.status,
    totalFound: row.total_found ?? 0,
    totalNew: row.total_new ?? 0,
    costUsd: row.cost_usd ?? 0,
    error: row.error_message,
  };
}

function toLeadRow(lead: ScoredLead, userId: string, searchId: string, city: string) {
  return {
    user_id: userId,
    search_id: searchId,
    city,
    place_id: lead.placeId,
    name: lead.name,
    category: lead.category,
    neighborhood: lead.neighborhood,
    address: lead.address,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    website: lead.website,
    digital_status: lead.digitalStatus,
    digital_label: lead.digitalLabel,
    rating: lead.rating,
    reviews_count: lead.reviewsCount,
    score: lead.score,
    temperature: lead.temperature,
    ticket: lead.ticket,
    suggested_package: lead.suggestedPackage,
    reason: lead.reason,
  };
}

async function loadExclusions(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ placeIds: Set<string>; phones: Set<string> }> {
  const { data } = await supabase
    .from("exclusions")
    .select("place_id, phone")
    .eq("user_id", userId);

  const placeIds = new Set<string>();
  const phones = new Set<string>();
  for (const row of (data ?? []) as Array<{ place_id: string | null; phone: string | null }>) {
    if (row.place_id) placeIds.add(row.place_id);
    if (row.phone) phones.add(row.phone);
  }
  return { placeIds, phones };
}

/**
 * Avança o estado de uma busca. Idempotente: uma vez `done`/`error`, apenas
 * devolve o resumo. Enquanto o run não termina, devolve `running`.
 */
export async function advanceSearch(
  supabase: SupabaseClient,
  search: SearchRow,
): Promise<SearchProgress> {
  if (search.status === "done" || search.status === "error") {
    return progressFromRow(search);
  }
  if (!search.apify_run_id) {
    return { status: "error", totalFound: 0, totalNew: 0, costUsd: 0, error: "Busca sem run do Apify." };
  }

  const run = await getRunState(search.apify_run_id);

  if (!isRunFinished(run.status)) {
    return { status: "running", totalFound: 0, totalNew: 0, costUsd: run.costUsd, error: null };
  }

  if (!isRunSuccess(run.status)) {
    await supabase
      .from("searches")
      .update({ status: "error", error_message: `Apify terminou como ${run.status}.`, finished_at: new Date().toISOString() })
      .eq("id", search.id);
    return { status: "error", totalFound: 0, totalNew: 0, costUsd: run.costUsd, error: `Apify terminou como ${run.status}.` };
  }

  // Reivindica o processamento: só um poll converte `running` -> `processing`.
  const { data: claimed } = await supabase
    .from("searches")
    .update({ status: "processing" })
    .eq("id", search.id)
    .eq("status", "running")
    .select("id")
    .maybeSingle();

  if (!claimed) {
    return { status: "running", totalFound: 0, totalNew: 0, costUsd: run.costUsd, error: null };
  }

  const datasetId = run.datasetId ?? search.apify_dataset_id;
  const items = datasetId ? await getDatasetItems(datasetId) : [];
  const scored = scoreAndFilter(items);

  const { placeIds, phones } = await loadExclusions(supabase, search.user_id);
  const keep = scored.filter(
    (lead) => !(lead.placeId && placeIds.has(lead.placeId)) && !(lead.phone && phones.has(lead.phone)),
  );

  const rows = keep
    .filter((lead) => lead.placeId)
    .map((lead) => toLeadRow(lead, search.user_id, search.id, search.city));

  let totalNew = 0;
  if (rows.length > 0) {
    const { data: inserted } = await supabase
      .from("leads")
      .upsert(rows, { onConflict: "user_id,place_id", ignoreDuplicates: true })
      .select("id");
    totalNew = inserted?.length ?? 0;
  }

  await supabase
    .from("searches")
    .update({
      status: "done",
      total_found: scored.length,
      total_new: totalNew,
      cost_usd: run.costUsd,
      finished_at: new Date().toISOString(),
    })
    .eq("id", search.id);

  return { status: "done", totalFound: scored.length, totalNew, costUsd: run.costUsd, error: null };
}
