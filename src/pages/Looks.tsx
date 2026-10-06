import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useItems, useOutfits } from '../db/repository'
import { CATEGORIAS, type Item } from '../types'
import { BlobImg, Cabecalho, Chip, Vazio, botao } from '../components/ui'

export function Looks() {
  const outfits = useOutfits()
  const items = useItems()
  const [tag, setTag] = useState<string>()

  const todasTags = [...new Set(outfits?.flatMap((o) => o.tags) ?? [])].sort()
  const lista = outfits?.filter((o) => !tag || o.tags.includes(tag)) ?? []
  const ordem = (i: Item) => CATEGORIAS.findIndex((c) => c.id === i.categoria)

  return (
    <>
      <Cabecalho titulo="Meus looks" />
      {todasTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          <Chip ativo={!tag} onClick={() => setTag(undefined)}>
            Todos
          </Chip>
          {todasTags.map((t) => (
            <Chip key={t} ativo={tag === t} onClick={() => setTag(tag === t ? undefined : t)}>
              {t}
            </Chip>
          ))}
        </div>
      )}

      {outfits?.length === 0 && (
        <Vazio
          emoji="⭐"
          titulo="Nenhum look salvo"
          texto="Monte um look ou sorteie um e toque em Salvar."
          acao={
            <div className="flex gap-2">
              <Link to="/montar" className={botao.secundario}>
                🧩 Montar
              </Link>
              <Link to="/sortear" className={botao.primario}>
                🎲 Sortear
              </Link>
            </div>
          }
        />
      )}

      <div className="grid grid-cols-2 gap-3 px-4">
        {lista.map((o) => {
          const pecas = o.itemIds
            .map((id) => items?.find((i) => i.id === id))
            .filter((i): i is Item => !!i)
            .sort((a, b) => ordem(a) - ordem(b))
          return (
            <Link key={o.id} to={`/montar/${o.id}`} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="grid aspect-square grid-cols-2 gap-0.5 bg-slate-100">
                {pecas.slice(0, 4).map((p) => (
                  <BlobImg key={p.id} blob={p.thumb} alt={p.nome} className="h-full w-full bg-white object-cover" />
                ))}
              </div>
              <div className="p-2.5">
                <p className="truncate text-sm font-medium">
                  {o.origem === 'aleatorio' && '🎲 '}
                  {o.nome}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {pecas.length} peças{o.tags.length > 0 && ` · ${o.tags.join(', ')}`}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
