// lib/llm.ts
// Camada de provedor de IA. Gera JSON estruturado a partir de um schema,
// despachando para Anthropic, OpenAI ou Google (Gemini) conforme a escolha
// do usuário. A chave pode ser a do próprio usuário (BYOK) ou a do servidor.
// SERVIDOR APENAS.
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { type LlmChoice, type LlmProvider } from "@/lib/llm-options";

export { resolveLlmChoice } from "@/lib/llm-options";
export type { LlmChoice, LlmProvider } from "@/lib/llm-options";

export interface GenerateJsonInput {
  system: string;
  prompt: string;
  /** JSON Schema do objeto de saída. */
  schema: Record<string, unknown>;
  maxTokens: number;
  apiKey: string;
}

const MAX_OUTPUT_TOKENS = 1024;

/** Chave do usuário (BYOK) tem prioridade; senão cai na do servidor. */
function resolveApiKey(provider: LlmProvider, userKey: string | null): string {
  const fallback: Record<LlmProvider, string | undefined> = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY,
  };
  const key = userKey ?? fallback[provider];
  if (!key) {
    throw new Error(`Sem chave de API para ${provider}. Informe a sua no perfil.`);
  }
  return key;
}

async function generateAnthropic(model: string, input: GenerateJsonInput): Promise<string> {
  const client = new Anthropic({ apiKey: input.apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: input.maxTokens,
    system: input.system,
    output_config: { format: { type: "json_schema", schema: input.schema } },
    messages: [{ role: "user", content: input.prompt }],
  });
  const block = response.content.find((item) => item.type === "text");
  if (!block || block.type !== "text") throw new Error("Anthropic: resposta sem texto.");
  return block.text;
}

async function generateOpenai(model: string, input: GenerateJsonInput): Promise<string> {
  const client = new OpenAI({ apiKey: input.apiKey });
  const response = await client.chat.completions.create({
    model,
    max_completion_tokens: input.maxTokens,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "resultado", schema: input.schema, strict: true },
    },
  });
  const content = response.choices[0]?.message.content;
  if (!content) throw new Error("OpenAI: resposta vazia.");
  return content;
}

async function generateGoogle(model: string, input: GenerateJsonInput): Promise<string> {
  const client = new GoogleGenAI({ apiKey: input.apiKey });
  const response = await client.models.generateContent({
    model,
    contents: input.prompt,
    config: {
      systemInstruction: input.system,
      maxOutputTokens: input.maxTokens,
      responseMimeType: "application/json",
      responseJsonSchema: input.schema,
    },
  });
  const text = response.text;
  if (!text) throw new Error("Google: resposta vazia.");
  return text;
}

const GENERATORS: Record<LlmProvider, (model: string, input: GenerateJsonInput) => Promise<string>> = {
  anthropic: generateAnthropic,
  openai: generateOpenai,
  google: generateGoogle,
};

/**
 * Gera um objeto JSON conforme o schema, usando o provedor escolhido e a chave
 * do usuário quando houver. A validação do formato final fica com quem chama.
 */
export async function generateJson(
  choice: LlmChoice,
  system: string,
  prompt: string,
  schema: Record<string, unknown>,
  userApiKey: string | null,
): Promise<unknown> {
  const raw = await GENERATORS[choice.provider](choice.model, {
    system,
    prompt,
    schema,
    maxTokens: MAX_OUTPUT_TOKENS,
    apiKey: resolveApiKey(choice.provider, userApiKey),
  });
  return JSON.parse(raw);
}
