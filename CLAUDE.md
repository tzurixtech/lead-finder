# CLAUDE.md — Tzurix LeadFinder

Regras que o agente deve seguir em todo o projeto. Leia junto com `PROJECT.md`.

## Fluxo de trabalho
- Siga o **Plano de Construção por fases** do PROJECT.md, em ordem. Não pule fases.
- Uma fase por vez. Ao terminar, rode os testes/checagens e faça um commit pequeno e descritivo.
- Antes de começar uma fase, releia a seção correspondente do PROJECT.md.

## Stack e padrões
- Next.js 14+ (App Router) + TypeScript **estrito**. Evite `any`; se usar, comente o porquê.
- Tailwind + shadcn/ui. UI toda em **português do Brasil**.
- Dados via `@supabase/supabase-js`. Sem ORM pesado.
- Prefira Server Components e Server Actions; client fetch só quando necessário.

## Segurança (inegociável)
- `APIFY_TOKEN` e `SUPABASE_SERVICE_ROLE_KEY` **só no servidor**. Nunca no bundle do client.
- Todo acesso a dados filtra por usuário; RLS habilitado no Supabase.
- Todo `insert` carrega `user_id`. Multiusuário desde já — não deixe "pra depois".
- Nunca commitar `.env*`. Confirmar `.gitignore`.

## Regras de negócio
- `lib/scoring.ts` é o coração. Alterou, rode `npm test` (Vitest) antes de seguir.
- Dedup por `place_id` por usuário. Respeitar a tabela `exclusions` antes de inserir/abordar.
- Buscas do Apify são assíncronas (2–5 min): use polling/webhook, nunca processamento síncrono na request.

## Dependências
- Antes de instalar lib nova, justifique em uma linha. Prefira o mínimo.

## Custos
- Cada busca Apify custa ~US$1–2. Mostrar custo estimado e pedir confirmação antes de buscas grandes.

## Definição de pronto (cada fase)
- Compila sem erro, lint limpo, testes do scoring passando quando aplicável, e o critério de aceite da fase (no PROJECT.md) atendido.
