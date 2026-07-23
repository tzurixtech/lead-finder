"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProfileInput } from "@/lib/profile";

export interface ProfileFormState {
  error: string | null;
  saved: boolean;
}

const REQUIRED_FIELDS: Array<keyof ProfileInput> = [
  "business_name",
  "what_you_sell",
  "value_proposition",
];

function optional(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function readInput(formData: FormData): ProfileInput | null {
  const business_name = String(formData.get("business_name") ?? "").trim();
  const what_you_sell = String(formData.get("what_you_sell") ?? "").trim();
  const value_proposition = String(formData.get("value_proposition") ?? "").trim();

  const input: ProfileInput = {
    business_name,
    what_you_sell,
    value_proposition,
    ideal_client: optional(formData.get("ideal_client")),
    price_range: optional(formData.get("price_range")),
    tone_signature: optional(formData.get("tone_signature")),
    good_lead_signals: optional(formData.get("good_lead_signals")),
  };

  const missing = REQUIRED_FIELDS.some((field) => input[field] === "");
  return missing ? null : input;
}

/** Grava (upsert) o perfil do usuário e marca o onboarding como concluído. */
async function saveProfile(formData: FormData): Promise<string | null> {
  const input = readInput(formData);
  if (!input) return "Preencha nome, o que você vende e a proposta de valor.";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Sessão expirada. Entre novamente.";

  const { error } = await supabase.from("business_profiles").upsert(
    {
      user_id: user.id,
      ...input,
      onboarding_done: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return error ? "Não foi possível salvar o perfil. Tente novamente." : null;
}

/** Onboarding: salva e libera o app. */
export async function completeOnboarding(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const error = await saveProfile(formData);
  if (error) return { error, saved: false };
  redirect("/");
}

/** Edição na página /perfil: salva e mostra sucesso. */
export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const error = await saveProfile(formData);
  if (error) return { error, saved: false };
  revalidatePath("/perfil");
  return { error: null, saved: true };
}
