-- =====================================================================
-- Guarda-Roupa Virtual · 0003 · Triggers, regras de negócio, views e busca
-- Funções internas ficam no schema "private" (não exposto pela API).
-- =====================================================================

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'categories', 'occasions', 'brands', 'items', 'item_images',
    'outfits', 'tags', 'wear_logs', 'capsules'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function private.set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Sincronização: mudanças em tabelas de ligação "encostam" no pai, para
-- que "where updated_at > :ultimo_sync" também pegue inclusões/remoções.
-- tg_argv[0] = tabela pai · tg_argv[1] = coluna FK para o pai
-- ---------------------------------------------------------------------
create function private.touch_parent()
returns trigger language plpgsql set search_path = '' as $$
declare
  linha jsonb := to_jsonb(case when tg_op = 'DELETE' then old else new end);
begin
  execute format('update public.%I set updated_at = now() where id = $1', tg_argv[0])
    using (linha ->> tg_argv[1])::uuid;
  return null;
end $$;

create trigger touch_item   after insert or update or delete on public.item_images    for each row execute function private.touch_parent('items', 'item_id');
create trigger touch_item   after insert or update or delete on public.item_colors    for each row execute function private.touch_parent('items', 'item_id');
create trigger touch_item   after insert or update or delete on public.item_occasions for each row execute function private.touch_parent('items', 'item_id');
create trigger touch_outfit after insert or update or delete on public.outfit_items   for each row execute function private.touch_parent('outfits', 'outfit_id');
create trigger touch_outfit after insert or update or delete on public.outfit_tags    for each row execute function private.touch_parent('outfits', 'outfit_id');
create trigger touch_log    after insert or update or delete on public.wear_log_items for each row execute function private.touch_parent('wear_logs', 'wear_log_id');
create trigger touch_capsule after insert or update or delete on public.capsule_items for each row execute function private.touch_parent('capsules', 'capsule_id');

-- ---------------------------------------------------------------------
-- Cadastro: cria o perfil quando um usuário se registra
-- ---------------------------------------------------------------------
create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), 80));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------
-- Categorias: hierarquia de 2 níveis, slot herdado do pai e coerente
-- ---------------------------------------------------------------------
create function private.categories_validate()
returns trigger language plpgsql set search_path = '' as $$
declare
  pai record;
begin
  if new.parent_id is not null then
    select c.owner_id, c.parent_id, c.slot into pai
      from public.categories c
     where c.id = new.parent_id
       and (c.owner_id is null or c.owner_id = new.owner_id);
    if not found then
      raise exception 'Categoria pai não encontrada' using errcode = 'foreign_key_violation';
    end if;
    if pai.parent_id is not null then
      raise exception 'Categorias têm no máximo 2 níveis (grupo › tipo)' using errcode = 'check_violation';
    end if;
    new.slot := coalesce(new.slot, pai.slot);
    if new.slot <> pai.slot then
      raise exception 'Subcategoria deve ocupar a mesma posição no look que o grupo (%)', pai.slot
        using errcode = 'check_violation';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.slot <> old.slot
     and exists (select 1 from public.items i where i.category_id = new.id) then
    raise exception 'Não é possível mudar a posição de uma categoria que já tem peças'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger validate before insert or update on public.categories
  for each row execute function private.categories_validate();

-- ---------------------------------------------------------------------
-- Peças: a categoria precisa ser do sistema ou do próprio dono.
-- Ao trocar de categoria, a posição da peça nos looks é recalculada
-- (e o trigger de outfit_items barra combinações que ficariam inválidas).
-- ---------------------------------------------------------------------
create function private.items_validate()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.categories c
     where c.id = new.category_id
       and (c.owner_id is null or c.owner_id = new.owner_id)
       and c.archived_at is null
  ) then
    raise exception 'Categoria inválida para esta peça' using errcode = 'foreign_key_violation';
  end if;
  return new;
end $$;

create trigger validate before insert or update of category_id on public.items
  for each row execute function private.items_validate();

create function private.items_resync_slots()
returns trigger language plpgsql set search_path = '' as $$
begin
  update public.outfit_items oi
     set slot = c.slot
    from public.categories c
   where oi.item_id = new.id
     and c.id = new.category_id
     and oi.slot <> c.slot;
  return null;
end $$;

create trigger resync_slots after update of category_id on public.items
  for each row execute function private.items_resync_slots();

create function private.item_occasions_validate()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.occasions o
     where o.id = new.occasion_id and (o.owner_id is null or o.owner_id = new.owner_id)
  ) then
    raise exception 'Ocasião inválida' using errcode = 'foreign_key_violation';
  end if;
  return new;
end $$;

create trigger validate before insert or update on public.item_occasions
  for each row execute function private.item_occasions_validate();

-- ---------------------------------------------------------------------
-- Looks: posição vem da categoria da peça; peça única não combina com
-- parte de cima/baixo; peça arquivada não entra em look novo.
-- (Uma peça por posição é garantida pelo índice outfit_items_one_per_slot.)
-- ---------------------------------------------------------------------
create function private.outfit_items_validate()
returns trigger language plpgsql set search_path = '' as $$
declare
  arquivada timestamptz;
begin
  select c.slot, i.archived_at into new.slot, arquivada
    from public.items i
    join public.categories c on c.id = i.category_id
   where i.id = new.item_id and i.owner_id = new.owner_id;

  if new.slot is null then
    raise exception 'Peça não encontrada' using errcode = 'foreign_key_violation';
  end if;
  if tg_op = 'INSERT' and arquivada is not null then
    raise exception 'Peça arquivada não pode entrar em um look' using errcode = 'check_violation';
  end if;

  if new.slot = 'one_piece' and exists (
       select 1 from public.outfit_items x
        where x.outfit_id = new.outfit_id and x.item_id <> new.item_id and x.slot in ('top', 'bottom'))
  then
    raise exception 'Peça única não combina com parte de cima/baixo no mesmo look' using errcode = 'check_violation';
  elsif new.slot in ('top', 'bottom') and exists (
       select 1 from public.outfit_items x
        where x.outfit_id = new.outfit_id and x.item_id <> new.item_id and x.slot = 'one_piece')
  then
    raise exception 'Este look já tem uma peça única (vestido/macacão)' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger validate before insert or update on public.outfit_items
  for each row execute function private.outfit_items_validate();

-- ---------------------------------------------------------------------
-- Estatísticas (security_invoker: respeitam o RLS de quem consulta)
-- ---------------------------------------------------------------------
create view public.item_stats with (security_invoker = true) as
select i.id                                         as item_id,
       i.owner_id,
       count(wli.wear_log_id)::int                  as wear_count,
       max(wl.worn_on)                              as last_worn_on,
       current_date - max(wl.worn_on)               as days_since_worn,
       round(i.price / nullif(count(wli.wear_log_id), 0), 2) as cost_per_wear
  from public.items i
  left join public.wear_log_items wli on wli.item_id = i.id
  left join public.wear_logs wl       on wl.id = wli.wear_log_id
 where i.archived_at is null
 group by i.id;

create view public.outfit_stats with (security_invoker = true) as
select o.id                  as outfit_id,
       o.owner_id,
       count(wl.id)::int     as wear_count,
       max(wl.worn_on)       as last_worn_on
  from public.outfits o
  left join public.wear_logs wl on wl.outfit_id = o.id
 where o.archived_at is null
 group by o.id;

-- ---------------------------------------------------------------------
-- Busca por texto (ignora acentos: "calca" encontra "calça")
-- ---------------------------------------------------------------------
create function public.search_items(q text)
returns setof public.items
language sql stable security invoker set search_path = '' as $$
  select i.*
    from public.items i
   where i.archived_at is null
     and i.search @@ websearch_to_tsquery('portuguese'::regconfig, public.immutable_unaccent(q))
   order by ts_rank(i.search, websearch_to_tsquery('portuguese'::regconfig, public.immutable_unaccent(q))) desc,
            i.created_at desc
$$;
