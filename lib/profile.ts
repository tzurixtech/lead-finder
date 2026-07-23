import { createClient } from "@/lib/supabase/server";

/** Perfil de negócio do usuário (linha de business_profiles). */
export interface BusinessProfile {
  user_id: string;
  business_name: string;
  what_you_sell: string;
  value_proposition: string;
  ideal_client: string | null;
  price_range: string | null;
  tone_signature: string | null;
  good_lead_signals: string | null;
  llm_provider: string | null;
  llm_model: string | null;
  onboarding_done: boolean;
}

/** Campos que o formulário edita. */
export interface ProfileInput {
  business_name: string;
  what_you_sell: string;
  value_proposition: string;
  ideal_client: string | null;
  price_range: string | null;
  tone_signature: string | null;
  good_lead_signals: string | null;
  llm_provider: string | null;
  llm_model: string | null;
}

/** Lê o perfil do usuário logado. Retorna null se ainda não existe. */
export async function getProfile(): Promise<BusinessProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("business_profiles")
    .select(
      "user_id, business_name, what_you_sell, value_proposition, ideal_client, price_range, tone_signature, good_lead_signals, llm_provider, llm_model, onboarding_done",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  // O client Supabase não é tipado com o schema gerado, então a linha volta
  // como `any`; fixamos o contrato aqui, na fronteira.
  return data as BusinessProfile | null;
}
