// lib/personalize.ts
// Agente de Personalização (IA): combina o perfil do usuário com o lead para
// gerar relevância + diagnóstico + 1ª mensagem, sob medida do que ELE vende.
// O provedor de IA (Anthropic/OpenAI/Gemini) vem da escolha do usuário.
// SERVIDOR APENAS.
import { generateJson, resolveLlmChoice } from "@/lib/llm";
import type { BusinessProfile } from "@/lib/profile";

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

const RESULT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    relevance: { type: "string", enum: ["ALTA", "MEDIA", "BAIXA"] },
    diagnosis: { type: "string" },
    opening_message: { type: "string" },
  },
  required: ["relevance", "diagnosis", "opening_message"],
};

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
    "Escreva em português do Brasil. Responda apenas com o JSON pedido.",
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
  const choice = resolveLlmChoice(profile.llm_provider, profile.llm_model);
  const parsed = await generateJson(choice, buildSystemPrompt(profile), buildLeadPrompt(lead), RESULT_SCHEMA);
  if (!isResult(parsed)) {
    throw new Error("Resposta da IA fora do formato esperado.");
  }
  return parsed;
}
