// lib/keys.ts
// Leitura/gravação das chaves de API dos usuários (BYOK). SERVIDOR APENAS.
// Os valores são cifrados; nunca retorne segredos a componentes de client.
import type { SupabaseClient } from "@supabase/supabase-js";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import type { LlmProvider } from "@/lib/llm-options";

const PROVIDERS: LlmProvider[] = ["anthropic", "openai", "google"];

export type KeyStatus = Record<LlmProvider, boolean>;

interface KeyRow {
  ciphertext: string;
  iv: string;
  tag: string;
}

/** Chave decifrada do usuário para um provedor, ou null se não houver. */
export async function getUserApiKey(
  supabase: SupabaseClient,
  provider: LlmProvider,
): Promise<string | null> {
  const { data } = await supabase
    .from("provider_keys")
    .select("ciphertext, iv, tag")
    .eq("provider", provider)
    .maybeSingle();
  if (!data) return null;
  return decryptSecret(data as KeyRow);
}

/** Quais provedores já têm chave salva (sem revelar os valores). */
export async function getKeyStatus(supabase: SupabaseClient): Promise<KeyStatus> {
  const { data } = await supabase.from("provider_keys").select("provider");
  const saved = new Set((data ?? []).map((row: { provider: string }) => row.provider));
  return {
    anthropic: saved.has("anthropic"),
    openai: saved.has("openai"),
    google: saved.has("google"),
  };
}

export async function saveUserApiKey(
  supabase: SupabaseClient,
  userId: string,
  provider: LlmProvider,
  plaintext: string,
): Promise<void> {
  const encrypted = encryptSecret(plaintext);
  await supabase.from("provider_keys").upsert(
    {
      user_id: userId,
      provider,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      tag: encrypted.tag,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" },
  );
}

export async function removeUserApiKey(supabase: SupabaseClient, provider: LlmProvider): Promise<void> {
  await supabase.from("provider_keys").delete().eq("provider", provider);
}

export function isProvider(value: string): value is LlmProvider {
  return (PROVIDERS as string[]).includes(value);
}
