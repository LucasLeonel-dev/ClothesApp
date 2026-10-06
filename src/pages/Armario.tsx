import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Settings2 } from 'lucide-react'
import { useItems } from '../db/repository'
import { CATEGORIAS, nomeCategoria, type Categoria } from '../types'
import { Abas, BlobImg, Vazio, botao } from '../components/ui'

const edicao = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(' de ', ' · ')

export function Armario() {
  const items = useItems()
  const [filtro, setFiltro] = useState<Categoria>()

  const lista = items?.filter((i) => !filtro || i.categoria === filtro) ?? []
  const contagem = (c?: Categoria) => items?.filter((i) => !c || i.categoria === c).length ?? 0
  const total = String(items?.length ?? 0).padStart(2, '0')

  return (
    <>
      {/* Masthead, como a capa de uma revista */}
      <header className="px-4 pt-5">
        <div className="flex items-center justify-between">
          <span className="rotulo text-muted">Nº {total}</span>
          <Link to="/ajustes" className="-mr-2 p-2" aria-label="Ajustes, aparência e backup">
            <Settings2 size={20} strokeWidth={1.25} />
          </Link>
        </div>
        <h1 className="mt-1 text-center font-serif whitespace-nowrap text-[clamp(2rem,10.2vw,3.6rem)] font-medium uppercase leading-none tracking-[-0.03em]">
          Guarda-Roupa
        </h1>
        <div className="rotulo mt-4 flex justify-between border-y border-ink py-2">
          <span>Edição de {edicao}</span>
          <span>
            {total} {items?.length === 1 ? 'peça' : 'peças'}
          </span>
        </div>
      </header>

      {items && items.length > 0 && (
        <div className="px-4">
          <Abas
            valor={filtro}
            onChange={setFiltro}
            opcoes={[
              { id: undefined, nome: 'Todas' },
              ...CATEGORIAS.filter((c) => contagem(c.id) > 0).map((c) => ({
                id: c.id,
                nome: c.nome,
                extra: <sup className="ml-0.5 text-[8px]">{contagem(c.id)}</sup>,
              })),
            ]}
          />
        </div>
      )}

      {items?.length === 0 && (
        <Vazio
          titulo="Um armário em branco"
          texto="Fotografe suas roupas sobre um fundo liso. Cada peça vira página desta revista, e as combinações vêm depois."
          acao={
            <Link to="/peca/nova" className={botao.primario}>
              Adicionar a primeira peça
            </Link>
          }
        />
      )}

      <div className="grid grid-cols-3 gap-x-3 gap-y-6 px-4 pt-5">
        {lista.map((item) => (
          <Link key={item.id} to={`/peca/${item.id}`} className="group">
            <div className="aspect-[3/4] border border-line bg-surface transition-colors group-hover:border-ink">
              <BlobImg blob={item.thumb} alt={item.nome} className="h-full w-full object-contain p-1.5" />
            </div>
            <p className="rotulo mt-2 text-[8.5px] text-muted">{nomeCategoria(item.categoria)}</p>
            <p className="mt-0.5 truncate font-serif text-[15px] italic leading-snug">{item.nome || 'Sem nome'}</p>
          </Link>
        ))}
      </div>

      <Link
        to="/peca/nova"
        aria-label="Adicionar peça"
        className="fixed bottom-24 right-[max(1rem,calc(50%-15rem))] z-20 flex h-14 w-14 items-center justify-center bg-ink text-bg shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] transition-opacity hover:opacity-85"
      >
        <Plus size={24} strokeWidth={1.25} />
      </Link>
    </>
  )
}
