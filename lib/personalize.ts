// lib/personalize.ts
// Agente de Personalização (IA): combina o perfil do usuário com o lead para
// gerar relevância + diagnóstico + 1ª mensagem, sob medida do que ELE vende.
// SERVIDOR APENAS — usa a ANTHROPIC_API_KEY.
import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env";
import type { BusinessProfile } from "@/lib/profile";

// Modelo barato para rodar em batch (PROJECT.md 5.4: ~R$ 0,01–0,05 por lead).
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 1024;

export type Relevance = "ALTA" | "MEDIA" | "BAIXA";

export interface PersonalizationResult {
  relevance: Relevance;
  diagnosis: string;
  opening_message: string;
}

/** Campos do lead que alimentam a personalização. */
export interface LeadForPersonalization {
  name: string;
  category: string | null;
  neighborhood: string | null;
  digital_label: string | null;
  rating: number | null;
  reviews_count: number | null;
  score: number | null;
}

const RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    relevance: { type: "string", enum: ["ALTA", "MEDIA", "BAIXA"] },
    diagnosis: { type: "string" },
    opening_message: { type: "string" },
  },
  required: ["relevance", "diagnosis", "opening_message"],
} as const;

function buildSystemPrompt(profile: BusinessProfile): string {
  const lines = [
    `Você é o assistente de prospecção de ${profile.business_name}.`,
    `O que ${profile.business_name} vende: ${profile.what_you_sell}.`,
    `Proposta de valor: ${profile.value_proposition}.`,
  ];
  if (profile.ideal_client) lines.push(`Cliente ideal: ${profile.ideal_client}.`);
  if (profile.price_range) lines.push(`Faixa de preço: ${profile.price_range}.`);
  if (profile.tone_signature) lines.push(`Tom e assinatura: ${profile.tone_signature}.`);
  if (profile.good_lead_signals) lines.push(`Sinais de bom lead para este negócio: ${profile.good_lead_signals}.`);
  lines.push(
    "",
    "Avalie se o lead precisa do que este negócio vende (relevance: ALTA, MEDIA ou BAIXA),",
    "com base no perfil acima — não apenas na presença digital.",
    "Gere um diagnóstico curto (2-3 pontos, citando os dados reais do lead) e uma mensagem",
    "de 1º contato no tom acima, oferecendo um diagnóstico/conversa gratuita, sem citar preço.",
    "Escreva em português do Brasil.",
  );
  return lines.join("\n");
}

function buildLeadPrompt(lead: LeadForPersonalization): string {
  const rating = lead.rating != null ? `nota ${lead.rating}` : "sem nota";
  const reviews = lead.reviews_count != null ? `${lead.reviews_count} avaliações` : "sem avaliações";
  return [
    `Lead analisado: ${lead.name}, ${lead.category ?? "categoria desconhecida"}, ${lead.neighborhood ?? "bairro desconhecido"}.`,
    `Situação digital: ${lead.digital_label ?? "desconhecida"}.`,
    `${rating} com ${reviews}. Score interno: ${lead.score ?? "n/d"}.`,
  ].join(" ");
}

function isResult(value: unknown): value is PersonalizationResult {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.relevance === "ALTA" || candidate.relevance === "MEDIA" || candidate.relevance === "BAIXA") &&
    typeof candidate.diagnosis === "string" &&
    typeof candidate.opening_message === "string"
  );
}

/** Gera relevância + diagnóstico + mensagem para um lead, sob o perfil do usuário. */
export async function personalizeLead(
  profile: BusinessProfile,
  lead: LeadForPersonalization,
): Promise<PersonalizationResult> {
  const client = new Anthropic({ apiKey: serverEnv.anthropicApiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(profile),
    output_config: { format: { type: "json_schema", schema: RESULT_SCHEMA } },
    messages: [{ role: "user", content: buildLeadPrompt(lead) }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Resposta da IA sem conteúdo de texto.");
  }

  const parsed: unknown = JSON.parse(textBlock.text);
  if (!isResult(parsed)) {
    throw new Error("Resposta da IA fora do formato esperado.");
  }
  return parsed;
}
