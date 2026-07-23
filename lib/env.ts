/**
 * Acesso tipado às variáveis de ambiente.
 * Segredos (service role, tokens) só existem no servidor — nunca importe
 * `serverEnv` em componentes de client.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

export const publicEnv = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
} as const;

export const serverEnv = {
  get supabaseServiceRoleKey(): string {
    return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get apifyToken(): string {
    return required("APIFY_TOKEN", process.env.APIFY_TOKEN);
  },
  get anthropicApiKey(): string {
    return required("ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY);
  },
} as const;
