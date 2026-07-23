// lib/llm-options.ts
// Catálogo de provedores/modelos de IA — módulo puro, seguro para o client
// (sem SDKs). lib/llm.ts (servidor) e a UI compartilham daqui.

export type LlmProvider = "anthropic" | "openai" | "google";

export interface LlmChoice {
  provider: LlmProvider;
  model: string;
}

/** Escolha padrão quando o usuário não seleciona (barata, PROJECT.md 5.4). */
export const DEFAULT_LLM: LlmChoice = { provider: "anthropic", model: "claude-haiku-4-5" };

/** Opções oferecidas na UI. As "barato" ficam primeiro por provedor. */
export const LLM_OPTIONS: ReadonlyArray<{ provider: LlmProvider; model: string; label: string }> = [
  { provider: "anthropic", model: "claude-haiku-4-5", label: "Claude Haiku 4.5 (barato)" },
  { provider: "anthropic", model: "claude-sonnet-5", label: "Claude Sonnet 5" },
  { provider: "openai", model: "gpt-4o-mini", label: "GPT-4o mini (barato)" },
  { provider: "openai", model: "gpt-4o", label: "GPT-4o" },
  { provider: "google", model: "gemini-2.0-flash", label: "Gemini 2.0 Flash (barato)" },
  { provider: "google", model: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
];

const KNOWN = new Set(LLM_OPTIONS.map((option) => `${option.provider}:${option.model}`));

/** Chave estável "provider:model" usada como value no formulário. */
export function llmKey(provider: string, model: string): string {
  return `${provider}:${model}`;
}

/** Normaliza provider+model salvos; cai no padrão se ausentes ou inválidos. */
export function resolveLlmChoice(provider: string | null, model: string | null): LlmChoice {
  if (provider && model && KNOWN.has(llmKey(provider, model))) {
    return { provider: provider as LlmProvider, model };
  }
  return DEFAULT_LLM;
}

/** Interpreta o value "provider:model" do formulário; null se inválido. */
export function parseLlmKey(value: string | null): LlmChoice | null {
  if (!value || !KNOWN.has(value)) return null;
  const [provider, model] = value.split(":");
  return { provider: provider as LlmProvider, model };
}
