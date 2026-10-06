-- =====================================================================
-- Guarda-Roupa Virtual · 0002 · Row Level Security + Storage
-- Regra geral: cada pessoa só enxerga e altera as próprias linhas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabelas com dono obrigatório: uma política única para tudo
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'brands', 'items', 'item_images', 'item_colors', 'item_occasions',
    'outfits', 'outfit_items', 'tags', 'outfit_tags',
    'wear_logs', 'wear_log_items', 'capsules', 'capsule_items'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$
      create policy "dono gerencia" on public.%I
        for all to authenticated
        using      (owner_id = (select auth.uid()))
        with check (owner_id = (select auth.uid()))
    $p$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Perfil: cada um lê e edita o seu (criação é feita pelo trigger de cadastro)
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "dono lê perfil" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "dono edita perfil" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Categorias e ocasiões: as do sistema (owner_id null) são visíveis a
-- todos; criar/alterar/excluir só as próprias.
-- ---------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.occasions  enable row level security;

create policy "lê sistema e próprias" on public.categories
  for select to authenticated using (owner_id is null or owner_id = (select auth.uid()));
create policy "cria próprias" on public.categories
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "altera próprias" on public.categories
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "exclui próprias" on public.categories
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "lê sistema e próprias" on public.occasions
  for select to authenticated using (owner_id is null or owner_id = (select auth.uid()));
create policy "cria próprias" on public.occasions
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "altera próprias" on public.occasions
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "exclui próprias" on public.occasions
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Paleta de cores: só leitura
alter table public.colors enable row level security;
create policy "todos leem" on public.colors for select to authenticated using (true);

-- Nada para visitantes não logados
revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------------
-- Storage: bucket privado; cada pessoa só mexe na pasta {seu uid}/...
-- Caminho: {uid}/items/{item_id}/{original|cutout|thumb}.jpg
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wardrobe', 'wardrobe', false, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "wardrobe: dono gerencia a própria pasta" on storage.objects
  for all to authenticated
  using      (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);
