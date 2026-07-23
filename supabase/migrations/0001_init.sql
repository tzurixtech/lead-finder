-- Tzurix LeadFinder — migração inicial (seção 4 do PROJECT.md)
-- Multiusuário por design: todo dado isolado por user_id + RLS.

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- PERFIL DO NEGÓCIO DO USUÁRIO (onboarding)
-- É o que personaliza toda a qualificação e as mensagens.
create table business_profiles (
  user_id uuid primary key references auth.users(id) default auth.uid(),
  business_name text not null,          -- ex: "Tzurix"
  what_you_sell text not null,          -- ex: "Sites profissionais + otimização do Google Meu Negócio"
  value_proposition text not null,      -- ex: "Fazer o negócio ser encontrado no Google por quem procura na cidade"
  ideal_client text,                    -- (opcional) nicho/porte alvo em texto livre
  price_range text,                     -- (opcional) faixa/pacotes
  tone_signature text,                  -- (opcional) tom + assinatura: nome, @, site
  -- sinais que importam pra ESTE usuário (o que torna um lead "bom" pra ele):
  good_lead_signals text,
  onboarding_done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- BUSCAS
create table searches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  niches text[] not null,            -- ex: ['pizzaria','padaria']
  city text not null,                -- ex: 'São Vicente, SP'
  max_per_niche int not null default 15,
  apify_run_id text,
  apify_dataset_id text,
  status text not null default 'pending', -- pending|running|done|error
  total_found int default 0,
  total_new int default 0,
  cost_usd numeric default 0,
  error_message text,
  created_at timestamptz default now(),
  finished_at timestamptz
);

-- LEADS
create table leads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  search_id uuid references searches(id) on delete set null,
  place_id text,                     -- id do Google, para dedup
  name text not null,
  category text,
  neighborhood text,
  address text,
  phone text,
  whatsapp text,                     -- normalizado wa.me quando celular
  website text,
  digital_status text,               -- SEM_SITE|SITE_FRACO|SITE_PROPRIO
  digital_label text,                -- rótulo legível
  rating numeric,
  reviews_count int,
  score int,
  temperature text,                  -- QUENTE|MORNO|FRIO
  ticket text,                       -- alto|medio|baixo
  suggested_package text,
  reason text,                       -- por que é bom lead
  stage text default 'Novo',         -- integra com o CRM
  notes text,
  -- gerados pelo Agente de Personalização (IA), sob medida do perfil do usuário:
  relevance text,                    -- ALTA|MEDIA|BAIXA — este lead precisa do que EU vendo?
  diagnosis text,                    -- diagnóstico específico p/ a oferta do usuário
  opening_message text,              -- 1ª mensagem pronta, na voz do usuário
  personalized boolean default false,
  created_at timestamptz default now(),
  unique (user_id, place_id)         -- dedup por usuário
);

-- LISTA DE EXCLUSÃO (não reabordar)
create table exclusions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  phone text,
  place_id text,
  reason text,                       -- pediu_saida|ja_cliente|manual
  created_at timestamptz default now()
);

-- RLS: cada usuário só vê o que é dele (pronto para SaaS)
alter table business_profiles enable row level security;
alter table searches   enable row level security;
alter table leads      enable row level security;
alter table exclusions enable row level security;

create policy "own profile"     on business_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own searches"    on searches   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own leads"       on leads      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own exclusions"  on exclusions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Índices úteis
create index on leads (user_id, temperature);
create index on leads (user_id, digital_status);
create index on leads (user_id, category);
