import type { Categoria, Montagem } from '../types'
import { emojiCategoria, nomeCategoria } from '../types'
import { BlobImg } from './ui'

interface Props {
  montagem: Montagem
  /** true = mostra "Peça única" no lugar de cima + baixo */
  modoUnica: boolean
  mostrarCasaco: boolean
  mostrarAcessorio: boolean
  onSlotClick?: (c: Categoria) => void
  travadas?: Partial<Record<Categoria, boolean>>
  onToggleTrava?: (c: Categoria) => void
}

/**
 * v1 da montagem: cada peça em seu "espaço", como um flat lay simples.
 * Futuro: trocar por um canvas com peças recortadas e posicionáveis.
 */
export function OutfitBoard({ montagem, modoUnica, mostrarCasaco, mostrarAcessorio, onSlotClick, travadas, onToggleTrava }: Props) {
  const slot = (c: Categoria, className: string) => {
    const item = montagem[c]
    const travada = travadas?.[c]
    return (
      <div key={c} className={`relative overflow-hidden rounded-2xl border-2 bg-white ${travada ? 'border-brand-500' : 'border-slate-100'} ${className}`}>
        <button
          type="button"
          disabled={!onSlotClick}
          onClick={() => onSlotClick?.(c)}
          className="flex h-full w-full items-center justify-center"
        >
          {item ? (
            <BlobImg blob={item.foto} alt={item.nome || nomeCategoria(c)} className="h-full w-full object-contain p-1" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-slate-400">
              <span className="text-3xl opacity-60">{emojiCategoria(c)}</span>
              <span className="text-xs">{onSlotClick ? `+ ${nomeCategoria(c)}` : nomeCategoria(c)}</span>
            </span>
          )}
        </button>
        {onToggleTrava && item && (
          <button
            type="button"
            onClick={() => onToggleTrava(c)}
            aria-label={travada ? 'Destravar peça' : 'Travar peça'}
            className={`absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-sm shadow ${
              travada ? 'bg-brand-600 text-white' : 'bg-white/90 text-slate-500'
            }`}
          >
            {travada ? '🔒' : '🔓'}
          </button>
        )}
      </div>
    )
  }

  const temLateral = mostrarCasaco || mostrarAcessorio
  return (
    <div className={`grid gap-2 ${temLateral ? 'grid-cols-3' : 'grid-cols-1'}`}>
      <div className={`flex flex-col gap-2 ${temLateral ? 'col-span-2' : 'mx-auto w-2/3'}`}>
        {modoUnica ? (
          slot('pecaUnica', 'aspect-[3/5]')
        ) : (
          <>
            {slot('cima', 'aspect-[4/3]')}
            {slot('baixo', 'aspect-[4/3]')}
          </>
        )}
        {slot('calcado', 'aspect-[2/1]')}
      </div>
      {temLateral && (
        <div className="flex flex-col gap-2">
          {mostrarCasaco && slot('casaco', 'aspect-[3/4]')}
          {mostrarAcessorio && slot('acessorio', 'aspect-square')}
        </div>
      )}
    </div>
  )
}
