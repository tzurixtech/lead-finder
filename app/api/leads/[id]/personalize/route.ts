import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { personalizeLead, type LeadForPersonalization } from "@/lib/personalize";

const LEAD_COLUMNS = "id, name, category, neighborhood, digital_label, rating, reviews_count, score";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const profile = await getProfile();
  if (!profile?.onboarding_done) {
    return NextResponse.json({ error: "Complete o perfil do negócio antes de personalizar." }, { status: 400 });
  }

  const { data: lead } = await supabase.from("leads").select(LEAD_COLUMNS).eq("id", id).maybeSingle();
  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  }

  try {
    const result = await personalizeLead(profile, lead as LeadForPersonalization);

    await supabase
      .from("leads")
      .update({
        relevance: result.relevance,
        diagnosis: result.diagnosis,
        opening_message: result.opening_message,
        personalized: true,
      })
      .eq("id", id);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Não foi possível personalizar o lead." }, { status: 502 });
  }
}
