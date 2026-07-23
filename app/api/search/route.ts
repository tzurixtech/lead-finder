import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startRun, buildSearchStrings } from "@/lib/apify";

const MAX_PER_NICHE_LIMIT = 30;
const MAX_NICHES = 10;

interface SearchBody {
  niches: string[];
  city: string;
  maxPerNiche: number;
}

function parseBody(raw: unknown): SearchBody | null {
  if (typeof raw !== "object" || raw === null) return null;
  const value = raw as Record<string, unknown>;

  const niches = Array.isArray(value.niches)
    ? Array.from(
        new Set(
          value.niches
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
        ),
      ).slice(0, MAX_NICHES)
    : [];

  const city = typeof value.city === "string" ? value.city.trim() : "";
  const rawMax = typeof value.maxPerNiche === "number" ? value.maxPerNiche : 15;
  const maxPerNiche = Math.min(Math.max(Math.trunc(rawMax), 1), MAX_PER_NICHE_LIMIT);

  if (niches.length === 0 || city.length === 0) return null;
  return { niches, city, maxPerNiche };
}

export async function POST(request: NextRequest) {
  const body = parseBody(await request.json().catch(() => null));
  if (!body) {
    return NextResponse.json({ error: "Informe ao menos um nicho e a cidade." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: search, error: insertError } = await supabase
    .from("searches")
    .insert({
      user_id: user.id,
      niches: body.niches,
      city: body.city,
      max_per_niche: body.maxPerNiche,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !search) {
    return NextResponse.json({ error: "Não foi possível criar a busca." }, { status: 500 });
  }

  try {
    const run = await startRun({
      searchStrings: buildSearchStrings(body.niches, body.city),
      city: body.city,
      maxPerSearch: body.maxPerNiche,
    });

    await supabase
      .from("searches")
      .update({ status: "running", apify_run_id: run.runId, apify_dataset_id: run.datasetId })
      .eq("id", search.id);

    return NextResponse.json({ searchId: search.id });
  } catch {
    await supabase
      .from("searches")
      .update({ status: "error", error_message: "Falha ao iniciar a busca no Apify." })
      .eq("id", search.id);
    return NextResponse.json({ error: "Falha ao iniciar a busca no Apify." }, { status: 502 });
  }
}
