# Guarda-Roupa Virtual

App (PWA) para fotografar suas roupas, montar looks manualmente ou por sorteio e salvar as combinações.

## Rodar
```
npm install
npm run dev -- --host
```
Abra o endereço "Network" mostrado no terminal pelo celular (mesma rede Wi-Fi).
Tirar fotos já funciona assim. Para instalar como app na tela inicial é preciso HTTPS: publique a pasta `dist/` (`npm run build`) em Netlify, Vercel ou Cloudflare Pages.

## Estrutura
- `src/db/` — banco local (IndexedDB/Dexie). `repository.ts` é a única porta de acesso aos dados → trocar por Supabase quando for para a nuvem.
- `src/lib/randomizer.ts` — regras do sorteio (filtros, peças travadas, peça única × cima+baixo).
- `src/components/OutfitBoard.tsx` — visual do look (v1). Será substituído pela montagem com recorte.
- `src/pages/` — Armário, Nova/Editar peça, Montar, Sortear, Looks, Ajustes/Backup.

## Banco de dados (fase nuvem · Supabase)
O app ainda usa o IndexedDB; o schema do Postgres já está pronto em `supabase/`:
- `migrations/…0001_schema.sql`: tipos, tabelas, restrições e índices
- `migrations/…0002_rls.sql`: Row Level Security + bucket privado `wardrobe` no Storage
- `migrations/…0003_functions.sql`: triggers (regras dos looks, sincronização), views `item_stats`/`outfit_stats`, `search_items()`
- `seed.sql`: 32 categorias (6 grupos › tipos), 7 ocasiões e 24 cores com valores LAB
- `tests/regras_e_rls.sql`: 33 verificações das regras e do isolamento entre usuários

Num projeto Supabase: `supabase link` → `supabase db push` (migrações) e rodar o `seed.sql`.
Para testar num Postgres comum, rode primeiro `tests/00_supabase_shim.sql` (simula auth/storage; **não** usar no Supabase), depois as migrações, o seed e `tests/regras_e_rls.sql`.
