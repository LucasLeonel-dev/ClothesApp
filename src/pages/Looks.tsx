import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useItems, useOutfits } from '../db/repository'
import { CATEGORIAS, type Item } from '../types'
import { Abas, BlobImg, Cabecalho, Vazio, botao } from '../components/ui'

export function Looks() {
  const outfits = useOutfits()
  const items = useItems()
  const [tag, setTag] = useState<string>()

  const todasTags = [...new Set(outfits?.flatMap((o) => o.tags) ?? [])].sort()
  const lista = outfits?.filter((o) => !tag || o.tags.includes(tag)) ?? []
  const ordem = (i: Item) => CATEGORIAS.findIndex((c) => c.id === i.categoria)

  return (
    <>
      <Cabecalho sobretitulo={`${String(outfits?.length ?? 0).padStart(2, '0')} combinações`} titulo="Meus looks" />
      {todasTags.length > 0 && (
        <div className="px-4">
          <Abas valor={tag} onChange={setTag} opcoes={[{ id: undefined, nome: 'Todos' }, ...todasTags.map((t) => ({ id: t, nome: t }))]} />
        </div>
      )}

      {outfits?.length === 0 && (
        <Vazio
          titulo="Nenhum look salvo"
          texto="Monte uma combinação peça por peça ou deixe o acaso escolher, e guarde aqui as favoritas."
          acao={
            <>
              <Link to="/montar" className={botao.secundario}>
                Montar
              </Link>
              <Link to="/sortear" className={botao.primario}>
                Sortear
              </Link>
            </>
          }
        />
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-8 px-4 pt-5">
        {lista.map((o) => {
          const pecas = o.itemIds
            .map((id) => items?.find((i) => i.id === id))
            .filter((i): i is Item => !!i)
            .sort((a, b) => ordem(a) - ordem(b))
            .slice(0, 4)
          return (
            <Link key={o.id} to={`/montar/${o.id}`} className="group">
              <div className="grid aspect-[4/5] grid-cols-2 gap-px border border-line bg-line transition-colors group-hover:border-ink">
                {pecas.map((p, i) => (
                  <div key={p.id} className={`bg-surface ${pecas.length % 2 === 1 && i === pecas.length - 1 ? 'col-span-2' : ''}`}>
                    <BlobImg blob={p.thumb} alt={p.nome} className="h-full w-full object-contain p-1.5" />
                  </div>
                ))}
              </div>
              <p className="rotulo mt-2.5 text-[8.5px] text-muted">
                {o.origem === 'aleatorio' ? 'Sorteado' : 'Montado'}
                {o.tags.length > 0 && ` · ${o.tags.join(' · ')}`}
              </p>
              <p className="mt-0.5 truncate font-serif text-lg italic leading-snug">{o.nome}</p>
            </Link>
          )
        })}
      </div>
    </>
  )
}
