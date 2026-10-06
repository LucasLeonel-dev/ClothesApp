-- =====================================================================
-- Guarda-Roupa Virtual · 0001 · Tipos, tabelas, restrições e índices
-- Escopo: app pessoal, só Brasil (preços em R$, busca em português).
-- =====================================================================

create extension if not exists citext   with schema extensions;
create extension if not exists unaccent with schema extensions;

-- unaccent() não é IMMUTABLE, então não pode ser usado em coluna gerada.
-- Esta versão fixa o dicionário e pode.
create function public.immutable_unaccent(text)
returns text
language sql immutable strict parallel safe
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

-- ---------------------------------------------------------------------
-- Tipos fixos (o que muda raramente). Rótulos em português ficam no app.
-- ---------------------------------------------------------------------
create type public.outfit_slot   as enum ('top', 'bottom', 'one_piece', 'footwear', 'outerwear', 'accessory');
create type public.item_status   as enum ('active', 'laundry', 'lent', 'stored');
create type public.image_kind    as enum ('original', 'cutout', 'thumb');
create type public.outfit_source as enum ('manual', 'random', 'ai');
create type public.color_family  as enum ('neutral', 'warm', 'cool', 'earth', 'metallic');

-- ---------------------------------------------------------------------
-- Perfil (1:1 com auth.users, criado por trigger no cadastro)
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Categorias: tipos de peça como LINHAS (não enum).
-- owner_id null = categoria do sistema; o slot diz onde a peça entra no look.
-- ---------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid references public.profiles (id) on delete cascade default auth.uid(),
  parent_id  uuid references public.categories (id) deferrable initially deferred,
  slot       public.outfit_slot not null,          -- herdado do pai quando omitido (trigger)
  name       extensions.citext not null check (char_length(name) between 1 and 40),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique nulls not distinct (owner_id, parent_id, name),
  check (parent_id is distinct from id)
);

create table public.occasions (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid references public.profiles (id) on delete cascade default auth.uid(),
  name       extensions.citext not null check (char_length(name) between 1 and 30),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique nulls not distinct (owner_id, name)
);

-- Paleta de referência global (seed). LAB permite medir distância/harmonia entre cores.
create table public.colors (
  id     smallint primary key,
  name   text not null unique,
  hex    char(7) not null check (hex ~* '^#[0-9a-f]{6}$'),
  family public.color_family not null,
  lab    real[] check (lab is null or array_length(lab, 1) = 3)
);

create table public.brands (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  name       extensions.citext not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name),
  unique (id, owner_id)
);

-- ---------------------------------------------------------------------
-- Peças
-- ---------------------------------------------------------------------
create table public.items (
  id           uuid primary key default gen_random_uuid(),   -- o app também gera (offline)
  owner_id     uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  category_id  uuid not null references public.categories (id)
               deferrable initially deferred,   -- checado no commit: permite apagar a conta inteira
  brand_id     uuid,
  name         text check (char_length(name) <= 120),
  size         text check (char_length(size) <= 20),
  formality    smallint check (formality between 1 and 5),  -- 1 = casa · 5 = black tie
  status       public.item_status not null default 'active',
  favorite     boolean not null default false,
  purchased_on date check (purchased_on <= current_date),
  price        numeric(10, 2) check (price >= 0),            -- R$
  notes        text check (char_length(notes) <= 1000),
  search       tsvector generated always as (
                 to_tsvector('portuguese'::regconfig,
                   public.immutable_unaccent(coalesce(name, '') || ' ' || coalesce(notes, '')))
               ) stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  archived_at  timestamptz,                                   -- soft delete
  unique (id, owner_id),                                      -- alvo das FKs compostas
  foreign key (brand_id, owner_id) references public.brands (id, owner_id)
);

create table public.item_images (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null,
  owner_id     uuid not null default auth.uid(),
  kind         public.image_kind not null,
  storage_path text not null unique,
  width        integer check (width > 0),
  height       integer check (height > 0),
  bytes        integer check (bytes > 0),
  dominant_hex char(7) check (dominant_hex ~* '^#[0-9a-f]{6}$'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (item_id, kind),
  -- a foto precisa estar na pasta do próprio dono no Storage
  check (storage_path like owner_id::text || '/%'),
  foreign key (item_id, owner_id) references public.items (id, owner_id) on delete cascade
);

create table public.item_colors (
  item_id    uuid not null,
  color_id   smallint not null references public.colors (id),
  owner_id   uuid not null default auth.uid(),
  is_primary boolean not null default false,
  primary key (item_id, color_id),
  foreign key (item_id, owner_id) references public.items (id, owner_id) on delete cascade
);
-- no máximo uma cor primária por peça
create unique index item_colors_one_primary on public.item_colors (item_id) where is_primary;

create table public.item_occasions (
  item_id     uuid not null,
  occasion_id uuid not null references public.occasions (id) on delete cascade,
  owner_id    uuid not null default auth.uid(),
  primary key (item_id, occasion_id),
  foreign key (item_id, owner_id) references public.items (id, owner_id) on delete cascade
);

-- ---------------------------------------------------------------------
-- Looks
-- ---------------------------------------------------------------------
create table public.outfits (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  name        text not null check (char_length(name) between 1 and 80),
  source      public.outfit_source not null default 'manual',
  rating      smallint check (rating between 1 and 5),
  notes       text check (char_length(notes) <= 1000),
  cover_path  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  archived_at timestamptz,
  unique (id, owner_id),
  check (cover_path is null or cover_path like owner_id::text || '/%')
);

-- Peças do look + layout da montagem visual (posição relativa 0–1).
create table public.outfit_items (
  outfit_id uuid not null,
  item_id   uuid not null,
  owner_id  uuid not null default auth.uid(),
  slot      public.outfit_slot not null,            -- copiado da categoria (trigger)
  pos_x     real check (pos_x between 0 and 1),
  pos_y     real check (pos_y between 0 and 1),
  scale     real not null default 1 check (scale > 0 and scale <= 5),
  rotation  real not null default 0 check (rotation between -360 and 360),
  z_index   smallint not null default 0,
  primary key (outfit_id, item_id),
  -- FKs compostas: a peça e o look precisam ser do MESMO dono
  foreign key (outfit_id, owner_id) references public.outfits (id, owner_id) on delete cascade,
  -- o app arquiva peças (soft delete); exclusão definitiva só ao apagar a conta
  foreign key (item_id, owner_id)   references public.items (id, owner_id) on delete cascade
);
-- uma peça por posição no look, exceto acessórios (pode ter vários)
create unique index outfit_items_one_per_slot on public.outfit_items (outfit_id, slot) where slot <> 'accessory';
create index outfit_items_item on public.outfit_items (item_id);

create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  name       extensions.citext not null check (char_length(name) between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name),
  unique (id, owner_id)
);

create table public.outfit_tags (
  outfit_id uuid not null,
  tag_id    uuid not null,
  owner_id  uuid not null default auth.uid(),
  primary key (outfit_id, tag_id),
  foreign key (outfit_id, owner_id) references public.outfits (id, owner_id) on delete cascade,
  foreign key (tag_id, owner_id)    references public.tags (id, owner_id) on delete cascade
);

-- ---------------------------------------------------------------------
-- Diário "o que vesti"
-- ---------------------------------------------------------------------
create table public.wear_logs (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  worn_on    date not null default current_date check (worn_on <= current_date + 1),
  outfit_id  uuid,
  notes      text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  foreign key (outfit_id, owner_id) references public.outfits (id, owner_id) on delete set null (outfit_id)
);

create table public.wear_log_items (
  wear_log_id uuid not null,
  item_id     uuid not null,
  owner_id    uuid not null default auth.uid(),
  primary key (wear_log_id, item_id),
  foreign key (wear_log_id, owner_id) references public.wear_logs (id, owner_id) on delete cascade,
  foreign key (item_id, owner_id)     references public.items (id, owner_id) on delete cascade
);
create index wear_log_items_item on public.wear_log_items (item_id);

-- ---------------------------------------------------------------------
-- Cápsulas / malas de viagem
-- ---------------------------------------------------------------------
create table public.capsules (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  name        extensions.citext not null check (char_length(name) between 1 and 60),
  notes       text check (char_length(notes) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  archived_at timestamptz,
  unique (owner_id, name),
  unique (id, owner_id)
);

create table public.capsule_items (
  capsule_id uuid not null,
  item_id    uuid not null,
  owner_id   uuid not null default auth.uid(),
  primary key (capsule_id, item_id),
  foreign key (capsule_id, owner_id) references public.capsules (id, owner_id) on delete cascade,
  foreign key (item_id, owner_id)    references public.items (id, owner_id) on delete cascade
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index items_owner_category on public.items (owner_id, category_id) where archived_at is null;
create index items_search         on public.items using gin (search);
create index wear_logs_owner_date on public.wear_logs (owner_id, worn_on desc);
create index categories_parent    on public.categories (parent_id);

-- (owner_id, updated_at) nas tabelas sincronizadas: "o que mudou desde X"
create index categories_sync on public.categories (owner_id, updated_at);
create index occasions_sync  on public.occasions  (owner_id, updated_at);
create index brands_sync     on public.brands     (owner_id, updated_at);
create index items_sync      on public.items      (owner_id, updated_at);
create index outfits_sync    on public.outfits    (owner_id, updated_at);
create index tags_sync       on public.tags       (owner_id, updated_at);
create index wear_logs_sync  on public.wear_logs  (owner_id, updated_at);
create index capsules_sync   on public.capsules   (owner_id, updated_at);
