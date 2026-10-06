import { Link } from 'react-router-dom'
import { useItems } from '../db/repository'
import type { Categoria, Item } from '../types'
import { nomeCategoria } from '../types'
import { BlobImg, Folha, botao } from './ui'

interface Props {
  categoria?: Categoria
  selecionado?: Item
  onEscolher: (item: Item | undefined) => void
  onFechar: () => void
}

/** Folha que lista as peças de uma categoria para escolher. */
export function ItemPicker({ categoria, selecionado, onEscolher, onFechar }: Props) {
  const items = useItems()
  const lista = items?.filter((i) => i.categoria === categoria) ?? []

  return (
    <Folha aberta={!!categoria} onFechar={onFechar} titulo={categoria ? nomeCategoria(categoria) : ''}>
      {lista.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <p className="text-sm text-muted">Você ainda não tem peças nesta categoria.</p>
          <Link to="/peca/nova" className={botao.secundario}>
            Adicionar peça
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {lista.map((item) => (
            <button
              key={item.id}
              onClick={() => onEscolher(item)}
              aria-pressed={selecionado?.id === item.id}
              className={`aspect-[3/4] border bg-bg ${selecionado?.id === item.id ? 'border-ink' : 'border-line'}`}
            >
              <BlobImg blob={item.thumb} alt={item.nome} className="h-full w-full object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
      {selecionado && (
        <button onClick={() => onEscolher(undefined)} className={`${botao.texto} mt-6 w-full text-center text-danger`}>
          Remover peça do look
        </button>
      )}
    </Folha>
  )
}
