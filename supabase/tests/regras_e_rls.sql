-- =====================================================================
-- Testes das regras de negócio e do RLS.
-- Roda tudo numa transação e desfaz no final (não deixa lixo).
-- Uso: psql -v ON_ERROR_STOP=1 -f supabase/tests/regras_e_rls.sql
-- =====================================================================
\set ON_ERROR_STOP on
\set QUIET on
begin;

create schema t;
grant usage on schema t to authenticated, anon;

-- Afirmação simples
create function t.confere(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FALHOU: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;

-- Espera que o SQL falhe com o SQLSTATE indicado
create function t.deve_falhar(sql text, estado text, msg text) returns void language plpgsql as $$
declare
  executou boolean := false;
begin
  begin
    execute sql;
    set constraints all immediate;  -- inclui as FKs adiadas (deferrable) na checagem
    executou := true;
  exception when others then
    if sqlstate <> estado then
      raise exception 'FALHOU: % — esperava erro %, veio % (%)', msg, estado, sqlstate, sqlerrm;
    end if;
    raise notice 'ok  % → "%"', msg, sqlerrm;
  end;
  if executou then raise exception 'FALHOU: % — deveria ter dado erro %', msg, estado; end if;
end $$;

-- Troca de usuário (simula o JWT do Supabase)
create function t.como(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true)
$$;
grant execute on all functions in schema t to authenticated, anon;

-- Cadastro de duas pessoas → perfis criados pelo trigger
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@exemplo.com', '{"name":"Ana"}'),
  ('22222222-2222-2222-2222-222222222222', 'bia@exemplo.com', '{}');
select t.confere((select count(*) from public.profiles) = 2, 'perfis criados no cadastro');
select t.confere((select display_name from public.profiles where id = '22222222-2222-2222-2222-222222222222') = 'bia',
                 'nome padrão vem do e-mail');

-- =====================================================================
\echo '--- Ana: peças e looks'
select t.como('11111111-1111-1111-1111-111111111111');
set local role authenticated;

create temp table ids (nome text primary key, id uuid) on commit drop;

with novas (nome, categoria, preco) as (values
  ('Camiseta branca',   'Camisetas', 60),
  ('Calça jeans escura','Calças',   100),
  ('Vestido floral',    'Vestidos', 150),
  ('Tênis branco',      'Tênis',    300),
  ('Bota preta',        'Botas',    400),
  ('Bolsa caramelo',    'Bolsas',   200),
  ('Cinto marrom',      'Cintos',    80)
), ins as (
  insert into public.items (name, category_id, price)
  select n.nome, c.id, n.preco
    from novas n join public.categories c on c.name = n.categoria and c.owner_id is null and c.parent_id is not null
  returning name, id
)
insert into ids select name, id from ins;
select t.confere((select count(*) from ids) = 7, 'Ana cadastrou 7 peças');

insert into public.outfits (id, name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Sexta casual');
insert into public.outfit_items (outfit_id, item_id)
select 'aaaaaaaa-0000-0000-0000-000000000001', id from ids
 where nome in ('Camiseta branca', 'Calça jeans escura', 'Tênis branco', 'Bolsa caramelo', 'Cinto marrom');
select t.confere((select count(*) from public.outfit_items) = 5, 'look com 2 acessórios é aceito');
select t.confere((select slot from public.outfit_items oi join ids on ids.id = oi.item_id where ids.nome = 'Camiseta branca') = 'top',
                 'posição no look vem da categoria (Camisetas → top)');

select t.deve_falhar(format($$insert into public.outfit_items (outfit_id, item_id) values ('aaaaaaaa-0000-0000-0000-000000000001', %L)$$,
                            (select id from ids where nome = 'Vestido floral')),
                     '23514', 'vestido + calça no mesmo look é barrado');
select t.deve_falhar(format($$insert into public.outfit_items (outfit_id, item_id) values ('aaaaaaaa-0000-0000-0000-000000000001', %L)$$,
                            (select id from ids where nome = 'Bota preta')),
                     '23505', 'dois calçados no mesmo look é barrado');
select t.deve_falhar(format($$update public.items set category_id = (select id from public.categories where name = 'Vestidos' and owner_id is null) where id = %L$$,
                            (select id from ids where nome = 'Camiseta branca')),
                     '23514', 'recategorizar peça que deixaria um look inválido é barrado');

-- Peça arquivada não entra em look novo
update public.items set archived_at = now() where id = (select id from ids where nome = 'Bota preta');
insert into public.outfits (id, name) values ('aaaaaaaa-0000-0000-0000-000000000002', 'Inverno');
select t.deve_falhar(format($$insert into public.outfit_items (outfit_id, item_id) values ('aaaaaaaa-0000-0000-0000-000000000002', %L)$$,
                            (select id from ids where nome = 'Bota preta')),
                     '23514', 'peça arquivada não entra em look novo');

-- Cor primária única
insert into public.item_colors (item_id, color_id, is_primary)
select id, 13, true from ids where nome = 'Calça jeans escura';
select t.deve_falhar(format($$insert into public.item_colors (item_id, color_id, is_primary) values (%L, 1, true)$$,
                            (select id from ids where nome = 'Calça jeans escura')),
                     '23505', 'só uma cor primária por peça');

-- Foto fora da pasta do dono
select t.deve_falhar(format($$insert into public.item_images (item_id, kind, storage_path) values (%L, 'original', '22222222-2222-2222-2222-222222222222/items/x.jpg')$$,
                            (select id from ids where nome = 'Camiseta branca')),
                     '23514', 'foto precisa estar na pasta do próprio dono');

\echo '--- Ana: categorias próprias'
insert into public.categories (name, parent_id)
values ('Cropped', (select id from public.categories where name = 'Partes de cima' and owner_id is null));
insert into ids select 'Cropped', id from public.categories where name = 'Cropped';
insert into public.occasions (name) values ('Balada');
insert into public.items (name, category_id) values ('Top cropped', (select id from ids where nome = 'Cropped'));
insert into public.item_occasions (item_id, occasion_id) select i.id, o.id from public.items i, public.occasions o where i.name = 'Top cropped' and o.name = 'Balada';
select t.confere((select slot from public.categories where name = 'Cropped') = 'top', 'subcategoria herda a posição do grupo');
select t.deve_falhar($$insert into public.categories (name, parent_id, slot) values ('Errada', (select id from public.categories where name = 'Partes de cima' and owner_id is null), 'bottom')$$,
                     '23514', 'subcategoria com posição diferente do grupo é barrada');
select t.deve_falhar($$insert into public.categories (name, parent_id) values ('Nível 3', (select id from public.categories where name = 'Cropped'))$$,
                     '23514', 'no máximo 2 níveis de categoria');

select t.deve_falhar($$delete from public.categories where name = 'Cropped'$$, '23503', 'categoria com peças não pode ser excluída');

\echo '--- Ana: busca, estatísticas e sincronização'
select t.confere((select count(*) from public.search_items('calca')) = 1, 'busca "calca" encontra "Calça jeans escura" (sem acento)');

insert into public.wear_logs (id, worn_on, outfit_id) values
  ('bbbbbbbb-0000-0000-0000-000000000001', current_date - 3, 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-000000000002', current_date - 1, 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.wear_log_items (wear_log_id, item_id)
select w, id from ids, unnest(array['bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002']::uuid[]) w
 where nome = 'Calça jeans escura';
select t.confere((select cost_per_wear from public.item_stats s join ids on ids.id = s.item_id where nome = 'Calça jeans escura') = 50.00,
                 'custo por uso: R$100 / 2 usos = R$50');
select t.confere((select days_since_worn from public.item_stats s join ids on ids.id = s.item_id where nome = 'Calça jeans escura') = 1,
                 'dias desde o último uso');
select t.confere((select wear_count from public.outfit_stats where outfit_id = 'aaaaaaaa-0000-0000-0000-000000000001') = 2,
                 'look usado 2 vezes');

-- envelhece o updated_at do look (sem o trigger, que sobrescreveria)
reset role;
alter table public.outfits disable trigger set_updated_at;
update public.outfits set updated_at = '2000-01-01' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
alter table public.outfits enable trigger set_updated_at;
set local role authenticated;
insert into public.tags (id, name) values ('cccccccc-0000-0000-0000-000000000001', 'Favoritos');
insert into public.outfit_tags (outfit_id, tag_id) values ('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001');
select t.confere((select updated_at > '2000-01-02' from public.outfits where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
                 'etiquetar um look atualiza o updated_at dele (sincronização)');

-- =====================================================================
\echo '--- Bia: isolamento entre usuários'
reset role;
select t.como('22222222-2222-2222-2222-222222222222');
set local role authenticated;

select t.confere((select count(*) from public.items) = 0, 'Bia não vê as peças da Ana');
select t.confere((select count(*) from public.outfits) = 0, 'Bia não vê os looks da Ana');
select t.confere((select count(*) from public.categories where owner_id is null) = 32, 'Bia vê as 32 categorias do sistema');
select t.confere((select count(*) from public.categories where name = 'Cropped') = 0, 'Bia não vê a categoria personalizada da Ana');

insert into public.outfits (id, name) values ('aaaaaaaa-0000-0000-0000-0000000000b1', 'Look da Bia');
select t.deve_falhar(format($$insert into public.outfit_items (outfit_id, item_id, owner_id) values ('aaaaaaaa-0000-0000-0000-0000000000b1', %L, '22222222-2222-2222-2222-222222222222')$$,
                            (select id from ids where nome = 'Camiseta branca')),
                     '23503', 'Bia não consegue pôr peça da Ana no look dela');
select t.deve_falhar($$insert into public.items (owner_id, name, category_id) values ('11111111-1111-1111-1111-111111111111', 'Intrusa', (select id from public.categories where name = 'Calças' and owner_id is null))$$,
                     '42501', 'Bia não consegue criar peça em nome da Ana');
select t.deve_falhar($$insert into public.items (name, category_id) values ('Categoria da Ana', (select id from ids where nome = 'Cropped'))$$,
                     '23503', 'Bia não usa categoria personalizada da Ana');

with alt as (update public.categories set name = 'Hackeada' where owner_id is null returning 1)
select t.confere((select count(*) from alt) = 0, 'Bia não altera categorias do sistema');

insert into storage.objects (bucket_id, name) values ('wardrobe', '22222222-2222-2222-2222-222222222222/items/a/original.jpg');
select t.deve_falhar($$insert into storage.objects (bucket_id, name) values ('wardrobe', '11111111-1111-1111-1111-111111111111/items/a/original.jpg')$$,
                     '42501', 'Bia não grava na pasta da Ana no Storage');

-- =====================================================================
\echo '--- Visitante não logado'
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select t.deve_falhar('select * from public.items', '42501', 'visitante não acessa as tabelas');

-- =====================================================================
\echo '--- Exclusão de conta'
reset role;
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
set constraints all immediate;  -- FKs adiadas seriam checadas no commit; força agora
select t.confere((select count(*) from public.items) = 0 and (select count(*) from public.outfits where owner_id = '11111111-1111-1111-1111-111111111111') = 0,
                 'excluir a conta apaga tudo da Ana em cascata');
select t.confere((select count(*) from public.outfits) = 1, 'dados da Bia continuam lá');

\echo ''
\echo 'TODOS OS TESTES PASSARAM'
rollback;
