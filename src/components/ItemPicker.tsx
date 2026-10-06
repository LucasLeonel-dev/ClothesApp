import { Link } from 'react-router-dom'
import { useItems } from '../db/repository'
import type { Categoria, Item } from '../types'
import { nomeCategoria } from '../types'
import { BlobImg, Folha } from './ui'

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
        <p className="py-6 text-center text-sm text-slate-500">
          Você ainda não tem peças nesta categoria.{' '}
          <Link to="/peca/nova" className="font-medium text-brand-600">
            Adicionar
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {lista.map((item) => (
            <button
              key={item.id}
              onClick={() => onEscolher(item)}
              className={`aspect-square overflow-hidden rounded-xl border-2 bg-slate-50 ${
                selecionado?.id === item.id ? 'border-brand-600' : 'border-transparent'
              }`}
            >
              <BlobImg blob={item.thumb} alt={item.nome} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {selecionado && (
        <button onClick={() => onEscolher(undefined)} className="mt-4 w-full py-2 text-sm text-red-600">
          Remover peça do look
        </button>
      )}
    </Folha>
  )
}
