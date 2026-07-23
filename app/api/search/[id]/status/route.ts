import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { advanceSearch, type SearchRow } from "@/lib/search";

const SEARCH_COLUMNS =
  "id, user_id, status, apify_run_id, apify_dataset_id, niches, city, max_per_niche, total_found, total_new, cost_usd, error_message";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: search } = await supabase
    .from("searches")
    .select(SEARCH_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (!search) {
    return NextResponse.json({ error: "Busca não encontrada." }, { status: 404 });
  }

  try {
    const progress = await advanceSearch(supabase, search as SearchRow);
    return NextResponse.json(progress);
  } catch {
    return NextResponse.json(
      { status: "error", totalFound: 0, totalNew: 0, costUsd: 0, error: "Erro ao processar a busca." },
      { status: 500 },
    );
  }
}
