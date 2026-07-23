-- Escolha de provedor/modelo de IA por usuário (Fase 4+).
-- Nulo = usa o padrão do servidor (Claude Haiku).
alter table business_profiles
  add column if not exists llm_provider text,  -- anthropic|openai|google
  add column if not exists llm_model text;     -- ex: claude-haiku-4-5, gpt-4o-mini, gemini-2.0-flash
