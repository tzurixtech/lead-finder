# Tzurix LeadFinder — Project Brief para Claude Code

> **Como usar este arquivo:** salve como `PROJECT.md` na raiz de um repositório vazio, abra o Claude Code nessa pasta e diga: *"Leia o PROJECT.md e implemente seguindo o Plano de Construção por fases. Comece pela Fase 0."* Trabalhe uma fase por vez, testando antes de avançar.

---

## 1. Visão do produto

Plataforma web de **prospecção personalizada**. No onboarding, o usuário **descreve o próprio negócio** (o que vende + proposta de valor). Depois escolhe **cidade + nicho** que quer atingir; o sistema busca negócios no Google Maps (via Apify), **enriquece e pontua** cada lead, e — usando o perfil do usuário — **gera um diagnóstico e uma mensagem de abordagem sob medida do que ELE vende**. Tudo salvo no banco e exibido num **dashboard com filtros e export**.

O diferencial: a qualificação e o pitch **não são fixos em "site + Google"**. Eles se adaptam à oferta de cada usuário. Um usuário que vende sites recebe o ângulo "negócio sem site perde cliente"; um que vende, por exemplo, sistema de agendamento, recebe outro ângulo — gerado por IA a partir do perfil dele.

**Usuário inicial:** Tzurix (que vende sites + Google). Mas o produto é **multiusuário por design**: cada conta tem seu perfil de negócio, seus leads e suas buscas isoladas por `user_id` + RLS. Já nasce pronto para virar SaaS.

**Os dois pilares de personalização:**
1. **Perfil do negócio do usuário** (o que vende, proposta de valor, cliente ideal, faixa de preço, tom/assinatura) — capturado no onboarding, editável.
2. **Agente de Personalização (IA)** que combina `perfil do usuário` + `dados do lead` para produzir a relevância, o diagnóstico e a 1ª mensagem.

---

## 2. Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Framework | **Next.js 14+ (App Router, TypeScript)** | Full-stack num projeto só; API Routes para o backend |
| UI | **Tailwind CSS + shadcn/ui** | Componentes prontos, visual limpo |
| Banco + Auth | **Supabase** (Postgres + Auth + RLS) | Banco gerenciado, login pronto, Row-Level Security para o futuro multiusuário |
| Fonte de dados | **Apify API** (actor `compass/crawler-google-places`) | Mesmo scraper já validado |
| Deploy | **Vercel** (app) + Supabase (cloud) | Deploy simples, tier grátis cobre o início |
| Estado/fetch | React Server Components + Server Actions; SWR onde precisar de client fetch | — |

**Não usar:** ORM pesado. Use o cliente oficial `@supabase/supabase-js` e SQL direto quando necessário.

---

## 3. Arquitetura (fluxo de uma busca)

```
[UI: form nicho+cidade]
      │ (Server Action)
      ▼
[POST /api/search] ──▶ cria registro em `searches` (status: running)
      │
      ▼
[Apify: inicia run do actor] ──▶ aguarda (poll) ou webhook
      │
      ▼
[Recebe dataset] ──▶ normaliza ──▶ classifica situação digital ──▶ calcula score
      │
      ▼
[Dedup contra `leads` do usuário] ──▶ insere novos ──▶ atualiza `searches` (done)
      │
      ▼
[Dashboard lê `leads` com filtros] ──▶ export CSV
```

**Sobre a espera do Apify:** o run demora ~2–5 min. Duas abordagens (implemente a A na v1, deixe a B documentada):
- **A (v1, simples):** endpoint dispara o run e faz *polling* do status; o front mostra "buscando..." com atualização. Use `runSync`? Não — pode estourar timeout. Prefira: iniciar run → salvar `apify_run_id` → front consulta `/api/search/[id]/status` a cada 5s.
- **B (evolução):** configurar **webhook do Apify** apontando para `/api/apify/webhook` que processa quando o run termina. Melhor para escala.

---

## 4. Modelo de dados (Supabase — SQL de migração)

```sql
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
  -- guardado como texto para a IA usar; ex: "negócio sem site ou site fraco, com boa reputação"
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
create policy "own searches"   on searches   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own leads"       on leads       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own exclusions"  on exclusions  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Índices úteis
create index on leads (user_id, temperature);
create index on leads (user_id, digital_status);
create index on leads (user_id, category);
```

---

## 5. Lógica de negócio (portar do script validado)

### 5.1 Classificação da situação digital
A partir do campo `website`:
- vazio → `SEM_SITE` (label "Sem site")
- contém `facebook|instagram|linktr|beacons|bio.link|wa.me|whatsapp|linktree|sites.google|wixsite|webnode|negocio.site|business.site|goo.gl|ifood|plataforma de cardápio` → `SITE_FRACO` (label conforme o caso: "Só Instagram", "Só Facebook", "Linktree", "Wix grátis", "Só WhatsApp", "Cardápio de terceiro", etc.)
- caso contrário → `SITE_PROPRIO` (não é lead — filtrar fora por padrão, mas manter no banco marcado)

### 5.2 Score (0–110)
```
score =
   pontos_situacao      // SEM_SITE 35 · domínio quebrado 34 · só WhatsApp/LinkedIn 33 ·
                        // Facebook pessoal 32 · Facebook 28 · Google Sites/Linktree 27 ·
                        // Instagram 25 · plataforma terceiro 24 · Wix grátis 22
 + pontos_reviews       // >=200:25 · >=80:19 · >=30:13 · >=10:7 · resto:3
 + pontos_reputacao     // nota>=4.7:15 · >=4.3:10 · nota<3.6:12 (dor) · resto:5
 + pontos_ticket        // alto:20 · medio:14 · baixo:8
 + bonus_celular        // telefone celular (13 9xxxx): +5
 + tem_telefone         // com telefone +3, sem -8
```
**Temperatura:** score ≥82 = QUENTE · ≥70 = MORNO · resto = FRIO.

**Ticket por categoria (alto):** odontologia, dentista, advogado, clínica de estética, imobiliária, contabilidade, buffet, climatização/ar-condicionado, fisioterapia, ótica-laboratório. **(médio):** pet shop, academia, oficina, materiais de construção, ótica, moda/roupa, esteticista. **(baixo):** o resto (padaria, lanchonete, pizzaria, barbearia, salão).

**Pacote sugerido:** alto → "Autoridade Local (R$ 3.500–5.500)"; médio → "Presença Essencial+ (R$ 2.200–3.500)"; baixo → "Presença Essencial (R$ 1.500–2.400)".

**Reason (texto):** gerar frase curta combinando situação + volume de avaliações + ticket.

> Coloque tudo isso em `lib/scoring.ts` com testes unitários (Vitest). É o **sinal-base** (rápido, determinístico, grátis). Os seeds prontos (`scoring.ts`, `categories.ts`, `competitors.ts`) já implementam isso.

> **Importante — o score é sinal, não veredito.** A pontuação por presença digital é ótima para quem vende site/Google (o caso Tzurix). Como o produto é multiusuário, o score serve para **ordenar e pré-filtrar** os leads; quem decide se o lead é realmente relevante para a oferta daquele usuário é o Agente de Personalização (5.4), que lê o `business_profile`. Ex.: um usuário que vende cardápio digital pode querer justamente quem já tem site — a IA ajusta a relevância ao perfil.

### 5.3 Dedup e exclusão
Antes de inserir: descartar se `place_id` já existe para o usuário, ou se `phone`/`place_id` está em `exclusions`.

### 5.4 Agente de Personalização (IA) — o núcleo do produto
Para cada lead novo (ou sob demanda no dashboard), um passo de IA gera 3 campos **sob medida do que o usuário vende**. Coloque em `lib/personalize.ts`.

**Entrada:** `business_profiles` do usuário (o que vende, proposta de valor, cliente ideal, faixa de preço, tom/assinatura, sinais de bom lead) + o lead enriquecido (nome, categoria, bairro, situação digital, nota, nº avaliações, score).

**Modelo:** LLM barato (GPT-4o-mini / Claude Haiku). Custo ~R$ 0,01–0,05 por lead. Rodar em batch, no servidor.

**Saída (JSON estruturado, gravado no lead):**
- `relevance`: `ALTA | MEDIA | BAIXA` — este lead precisa do que o usuário vende? (a IA justifica com base no perfil, não só na presença digital)
- `diagnosis`: diagnóstico curto de 2–3 pontos, específico da oferta do usuário e citando dados reais do lead (nota, avaliações, situação)
- `opening_message`: 1ª mensagem de abordagem pronta, no tom/assinatura do usuário, oferecendo o próximo passo — **sem falar preço**

**Prompt (esqueleto):**
```
Você é o assistente de prospecção de {business_name}.
O que {business_name} vende: {what_you_sell}.
Proposta de valor: {value_proposition}.
Cliente ideal: {ideal_client}. Faixa de preço: {price_range}.
Tom e assinatura: {tone_signature}.
Sinais de bom lead para este negócio: {good_lead_signals}.

Lead analisado: {nome}, {categoria}, {bairro}. Situação digital: {digital_label}.
Nota {rating} com {reviews_count} avaliações. Score interno: {score}.

Tarefa: avalie se este lead precisa do que {business_name} vende (relevance).
Gere um diagnóstico curto (2-3 pontos, cite os dados reais) e uma mensagem de
1º contato no tom acima, oferecendo um diagnóstico/conversa gratuita, sem citar preço.
Responda em JSON: { "relevance": "...", "diagnosis": "...", "opening_message": "..." }
```
> Dica: alimente 1–2 exemplos das melhores mensagens do usuário (few-shot) para a saída sair na voz dele.

---

## 6. Integração Apify

- Endpoint do actor: `POST https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=APIFY_TOKEN`
- Body:
```json
{
  "searchStringsArray": ["<nicho> em <cidade>", "..."],
  "locationQuery": "<cidade>",
  "maxCrawledPlacesPerSearch": 15,
  "language": "pt-BR",
  "skipClosedPlaces": true
}
```
- Ler status: `GET /v2/actor-runs/{runId}?token=...` (campo `status`, `SUCCEEDED` quando pronto).
- Ler resultados: `GET /v2/datasets/{datasetId}/items?token=...&fields=title,categoryName,neighborhood,street,phone,website,totalScore,reviewsCount,placeId,url`
- **Nunca** expor o `APIFY_TOKEN` no client. Só em API Routes/Server Actions.

---

## 7. Rotas / telas

**API (server):**
- `GET/POST /api/profile` — lê/salva o perfil de negócio do usuário (onboarding)
- `POST /api/search` — cria busca, dispara Apify, retorna `searchId`
- `GET  /api/search/[id]/status` — status do run + progresso
- `POST /api/apify/webhook` — (Fase futura) processa dataset quando run termina
- `POST /api/leads/[id]/personalize` — gera relevance + diagnóstico + mensagem via IA (usa o perfil)
- `GET  /api/leads` — lista com filtros (query params: temperature, relevance, digital_status, category, city, search)
- `GET  /api/leads/export` — CSV (respeita filtros)
- `POST /api/exclusions` — adiciona à lista de exclusão

**Páginas (UI):**
- `/login` — Supabase Auth (email mágico ou senha)
- `/onboarding` — **primeiro acesso**: usuário descreve o negócio (nome, o que vende, proposta de valor e, opcional, cliente ideal / faixa de preço / tom-assinatura). Só libera o resto quando `onboarding_done = true`. Editável depois em `/perfil`.
- `/perfil` — editar o perfil de negócio a qualquer momento
- `/` (Dashboard) — KPIs (total, quentes, alta relevância, sem site) + tabela de leads com filtros + Export
- `/buscar` — formulário (nichos como tags, cidade, máx por nicho) + tela de progresso
- `/busca/[id]` — resultado de uma busca específica
- `/lead/[id]` — detalhe do lead: dados, score, **relevância + diagnóstico + mensagem gerados pela IA** (com botão "regenerar"), notas, etapa, adicionar à exclusão
- `/exclusoes` — gerenciar lista de exclusão

> Guard de rota: se `onboarding_done` for falso, redirecionar para `/onboarding`. A personalização depende do perfil existir.

---

## 8. Variáveis de ambiente (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     # só no server
APIFY_TOKEN=...                    # só no server — NUNCA no client
OPENAI_API_KEY=...                 # ou ANTHROPIC_API_KEY — Agente de Personalização, só no server
```
> ⚠️ Gere um **novo** token do Apify (o anterior foi exposto). Configure em Vercel > Environment Variables no deploy.

---

## 9. Estrutura de pastas alvo

```
tzurix-leadfinder/
├─ PROJECT.md
├─ CLAUDE.md                 # regras curtas pro agente (ver seção 11)
├─ app/
│  ├─ (auth)/login/page.tsx
│  ├─ onboarding/page.tsx     # perfil do negócio (1º acesso)
│  ├─ perfil/page.tsx         # editar perfil
│  ├─ page.tsx               # dashboard
│  ├─ buscar/page.tsx
│  ├─ busca/[id]/page.tsx
│  ├─ lead/[id]/page.tsx
│  ├─ exclusoes/page.tsx
│  └─ api/
│     ├─ profile/route.ts
│     ├─ search/route.ts
│     ├─ search/[id]/status/route.ts
│     ├─ leads/route.ts
│     ├─ leads/[id]/personalize/route.ts
│     ├─ leads/export/route.ts
│     └─ apify/webhook/route.ts
├─ lib/
│  ├─ supabase/ (client.ts, server.ts)
│  ├─ apify.ts               # chamadas ao Apify
│  ├─ scoring.ts             # classificação + score-base (seed pronto, com testes)
│  ├─ categories.ts          # mapa de ticket por categoria (seed pronto)
│  ├─ competitors.ts         # concorrentes-com-site por categoria (seed pronto)
│  └─ personalize.ts         # Agente de Personalização (IA): relevance+diagnóstico+mensagem
├─ components/ (ui shadcn + LeadsTable, Filters, SearchForm, ProfileForm, LeadPitch...)
├─ supabase/migrations/      # SQL da seção 4
└─ tests/ (scoring.test.ts)
```

---

## 10. Plano de construção por fases (siga em ordem)

**Fase 0 — Setup**
Criar app Next.js + TS + Tailwind + shadcn/ui. Conectar Supabase (projeto novo). Rodar a migração da seção 4 (inclui `business_profiles`). Configurar `.env.local`. Login funcional (Supabase Auth). Critério: consigo logar e ver uma home vazia protegida.

**Fase 1 — Onboarding + perfil do negócio**
Tela `/onboarding` que captura e salva o `business_profile` (nome, o que vende, proposta de valor; opcionais: cliente ideal, faixa de preço, tom-assinatura, sinais de bom lead). `/perfil` para editar. Guard de rota: sem `onboarding_done`, redireciona pro onboarding. Critério: crio meu perfil, ele persiste, e o app libera o resto.

**Fase 2 — Núcleo de scoring-base (sem UI)**
Colocar os seeds prontos `lib/scoring.ts`, `lib/categories.ts`, `lib/competitors.ts` e criar `lib/apify.ts`. Escrever testes do scoring (Vitest). Critério: `npm test` passa; lead mock → score e temperatura corretos.

**Fase 3 — Busca ponta a ponta**
`POST /api/search` dispara Apify, salva `searches`, faz polling, normaliza, pontua (score-base), deduplica, insere em `leads`. Tela `/buscar` com form e progresso. Critério: rodar busca real ("pizzaria em São Vicente") e ver leads pontuados no banco.

**Fase 4 — Agente de Personalização (IA)**
`lib/personalize.ts` + `POST /api/leads/[id]/personalize`. Para cada lead (batch após a busca, ou botão no detalhe), gerar `relevance` + `diagnosis` + `opening_message` usando o `business_profile`. Critério: dois perfis diferentes (ex.: "vendo sites" vs "vendo cardápio digital") geram pitches diferentes para o mesmo lead.

**Fase 5 — Dashboard + filtros + export**
Dashboard com KPIs (total, quentes, alta relevância, sem site), `LeadsTable`, filtros (temperatura, relevância, situação, categoria, cidade, texto), paginação. `/lead/[id]` com dados + pitch da IA (botão regenerar) + etapa/notas. Export CSV. Critério: filtrar/exportar e ver o pitch por lead.

**Fase 6 — Exclusão + polimento**
Tela de exclusões, botão "não abordar", dedup respeitando exclusão. Loading/erros/responsivo. Critério: lead excluído não reaparece.

**Fase 7 (opcional) — SaaS / webhook Apify**
Migrar polling → webhook do Apify. Planos/limites por conta (nº de buscas/mês, teto de custo Apify). Billing (Stripe) se for abrir para outros usuários.

---

## 11. Conteúdo sugerido do `CLAUDE.md` (regras para o agente durante o build)

```md
# Regras do projeto
- TypeScript estrito. Nada de `any` sem justificar.
- Segredos (APIFY_TOKEN, service role) só no servidor. Nunca no client bundle.
- Todo acesso a dados passa por Supabase com RLS; sempre filtrar por user.
- `lib/scoring.ts` é crítico: mudou, rode os testes.
- Commits pequenos por fase. Não pular fases do PROJECT.md.
- Antes de instalar lib nova, justifique. Prefira o mínimo.
- UI em pt-BR. Componentes shadcn/ui.
```

---

## 12. Riscos e cuidados
- **Token Apify exposto** anteriormente: gerar novo antes de qualquer coisa.
- **Custo Apify:** cada busca custa ~US$1–2. Adicionar um teto/confirmação antes de rodar buscas grandes; mostrar custo estimado.
- **LGPD:** dados são de negócios (telefone comercial público), mas a lista de exclusão e a identificação nas abordagens são obrigatórias — a exclusão já está no modelo.
- **Rate limit / timeouts:** buscas longas não podem travar a request HTTP — por isso polling/webhook, nunca processamento síncrono de 5 min.
- **Multiusuário desde já:** todo insert carrega `user_id`; RLS liga. Não tome atalho de "depois eu separo por usuário".

---
**Tzurix LeadFinder** · brief para Claude Code · www.tzurix.com.br
