-- =====================================================================
-- Guarda-Roupa Virtual · dados do sistema (categorias, ocasiões, cores)
-- Rodado pela migração/CLI com papel de serviço (owner_id = null).
-- =====================================================================

-- Grupos (nível 1): definem a posição no look
insert into public.categories (owner_id, name, slot, sort_order) values
  (null, 'Partes de cima',  'top',       1),
  (null, 'Partes de baixo', 'bottom',    2),
  (null, 'Peças únicas',    'one_piece', 3),
  (null, 'Calçados',        'footwear',  4),
  (null, 'Casacos',         'outerwear', 5),
  (null, 'Acessórios',      'accessory', 6);

-- Tipos (nível 2): herdam o slot do grupo
insert into public.categories (owner_id, parent_id, name, sort_order)
select null, g.id, t.name, t.ord
  from (values
    ('Partes de cima',  'Camisetas', 1), ('Partes de cima',  'Camisas',  2),
    ('Partes de cima',  'Blusas',    3), ('Partes de cima',  'Regatas',  4),
    ('Partes de cima',  'Tricôs',    5),
    ('Partes de baixo', 'Calças',    1), ('Partes de baixo', 'Shorts',   2),
    ('Partes de baixo', 'Saias',     3), ('Partes de baixo', 'Bermudas', 4),
    ('Peças únicas',    'Vestidos',  1), ('Peças únicas',    'Macacões', 2),
    ('Calçados',        'Tênis',     1), ('Calçados',        'Sapatos',  2),
    ('Calçados',        'Sandálias', 3), ('Calçados',        'Botas',    4),
    ('Calçados',        'Chinelos',  5),
    ('Casacos',         'Jaquetas',  1), ('Casacos',         'Moletons', 2),
    ('Casacos',         'Blazers',   3), ('Casacos',         'Casacos',  4),
    ('Acessórios',      'Bolsas',    1), ('Acessórios',      'Cintos',   2),
    ('Acessórios',      'Bijuterias e joias', 3), ('Acessórios', 'Óculos', 4),
    ('Acessórios',      'Bonés e chapéus', 5),    ('Acessórios', 'Relógios', 6)
  ) as t (grupo, name, ord)
  join public.categories g on g.name = t.grupo and g.owner_id is null and g.parent_id is null;

insert into public.occasions (owner_id, name, sort_order) values
  (null, 'Casual', 1), (null, 'Trabalho', 2), (null, 'Festa', 3),
  (null, 'Esporte', 4), (null, 'Casa', 5), (null, 'Formal', 6), (null, 'Praia', 7);

-- Paleta de referência · lab = CIELAB (D65), para distância/harmonia de cores
insert into public.colors (id, name, hex, family, lab) values
  (1,  'Preto',         '#111111', 'neutral',  '{5.1,0.0,0.0}'),
  (2,  'Branco',        '#ffffff', 'neutral',  '{100.0,0.0,0.0}'),
  (3,  'Off-white',     '#f4f1e8', 'neutral',  '{95.1,-0.5,4.7}'),
  (4,  'Cinza',         '#9ca3af', 'neutral',  '{66.8,0.0,-7.1}'),
  (5,  'Grafite',       '#3f3f46', 'neutral',  '{26.9,1.6,-4.3}'),
  (6,  'Bege',          '#e7d7b9', 'earth',    '{86.5,0.8,16.8}'),
  (7,  'Caqui',         '#b5a27a', 'earth',    '{67.3,0.9,23.4}'),
  (8,  'Marrom',        '#7c4a2d', 'earth',    '{36.7,18.3,26.1}'),
  (9,  'Caramelo',      '#b5713a', 'earth',    '{54.0,21.9,41.0}'),
  (10, 'Verde-oliva',   '#6b7040', 'earth',    '{45.7,-10.0,26.0}'),
  (11, 'Azul',          '#2563eb', 'cool',     '{46.1,31.0,-73.8}'),
  (12, 'Azul-marinho',  '#1e2a4a', 'cool',     '{17.6,5.9,-21.5}'),
  (13, 'Jeans',         '#4b6c9c', 'cool',     '{45.1,2.3,-29.7}'),
  (14, 'Azul-claro',    '#9cc3e6', 'cool',     '{77.2,-4.8,-21.6}'),
  (15, 'Verde',         '#16a34a', 'cool',     '{58.8,-54.4,36.2}'),
  (16, 'Roxo',          '#7c3aed', 'cool',     '{43.4,64.8,-79.1}'),
  (17, 'Lilás',         '#c4b5fd', 'cool',     '{77.2,19.9,-33.7}'),
  (18, 'Amarelo',       '#facc15', 'warm',     '{83.7,1.7,82.5}'),
  (19, 'Laranja',       '#f97316', 'warm',     '{63.7,47.1,67.6}'),
  (20, 'Vermelho',      '#dc2626', 'warm',     '{47.9,67.0,46.9}'),
  (21, 'Vinho',         '#6d1a2c', 'warm',     '{24.2,37.5,10.2}'),
  (22, 'Rosa',          '#f472b6', 'warm',     '{65.5,57.2,-12.0}'),
  (23, 'Dourado',       '#c9a227', 'metallic', '{68.3,2.9,63.9}'),
  (24, 'Prateado',      '#c0c0c0', 'metallic', '{77.7,0.0,0.0}');
