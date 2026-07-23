import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const REASONS = ["nao_abordar", "manual", "pediu_saida", "ja_cliente"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const phone = typeof raw?.phone === "string" ? raw.phone.trim() : "";
  const placeId = typeof raw?.place_id === "string" ? raw.place_id.trim() : "";
  const reasonInput = typeof raw?.reason === "string" ? raw.reason : "manual";
  const reason = REASONS.includes(reasonInput) ? reasonInput : "manual";

  if (!phone && !placeId) {
    return NextResponse.json({ error: "Informe telefone ou place_id." }, { status: 400 });
  }

  const { error } = await supabase.from("exclusions").insert({
    user_id: user.id,
    phone: phone || null,
    place_id: placeId || null,
    reason,
  });
  if (error) {
    return NextResponse.json({ error: "Não foi possível adicionar à exclusão." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
