import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useItems } from '../db/repository'
import { CATEGORIAS, type Categoria } from '../types'
import { BlobImg, Cabecalho, Chip, Vazio, botao } from '../components/ui'

export function Armario() {
  const items = useItems()
  const [filtro, setFiltro] = useState<Categoria>()

  const lista = items?.filter((i) => !filtro || i.categoria === filtro) ?? []
  const contagem = (c: Categoria) => items?.filter((i) => i.categoria === c).length ?? 0

  return (
    <>
      <Cabecalho
        titulo="Meu armário"
        direita={
          <Link to="/ajustes" className="rounded-full p-2 text-xl" aria-label="Ajustes e backup">
            ⚙️
          </Link>
        }
      />
      {items && items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          <Chip ativo={!filtro} onClick={() => setFiltro(undefined)}>
            Todas ({items.length})
          </Chip>
          {CATEGORIAS.map((c) => (
            <Chip key={c.id} ativo={filtro === c.id} onClick={() => setFiltro(filtro === c.id ? undefined : c.id)}>
              {c.emoji} {c.nome} ({contagem(c.id)})
            </Chip>
          ))}
        </div>
      )}

      {items?.length === 0 && (
        <Vazio
          emoji="📸"
          titulo="Seu armário está vazio"
          texto="Tire fotos das suas roupas para começar a montar looks."
          acao={
            <Link to="/peca/nova" className={botao.primario}>
              Adicionar primeira peça
            </Link>
          }
        />
      )}

      <div className="grid grid-cols-3 gap-2 px-4">
        {lista.map((item) => (
          <Link key={item.id} to={`/peca/${item.id}`} className="group relative aspect-square overflow-hidden rounded-xl bg-white shadow-sm">
            <BlobImg blob={item.thumb} alt={item.nome} className="h-full w-full object-cover" />
            {item.nome && (
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 px-2 pb-1 pt-4 text-[11px] text-white">
                {item.nome}
              </span>
            )}
          </Link>
        ))}
      </div>

      <Link
        to="/peca/nova"
        aria-label="Adicionar peça"
        className="fixed bottom-24 right-[max(1rem,calc(50%-15rem))] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-3xl text-white shadow-lg active:bg-brand-700"
      >
        +
      </Link>
    </>
  )
}
