-- Chaves de API dos próprios usuários (BYOK), cifradas em repouso.
-- Uma linha por (usuário, provedor). Nunca expor os valores ao client.
create table provider_keys (
  user_id uuid not null references auth.users(id) default auth.uid(),
  provider text not null,            -- anthropic|openai|google
  ciphertext text not null,
  iv text not null,
  tag text not null,
  updated_at timestamptz default now(),
  primary key (user_id, provider)
);

alter table provider_keys enable row level security;

create policy "own provider keys" on provider_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
