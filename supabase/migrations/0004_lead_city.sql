-- Cidade da busca copiada para o lead, para filtro/export no dashboard.
alter table leads add column if not exists city text;
create index if not exists leads_user_city_idx on leads (user_id, city);
