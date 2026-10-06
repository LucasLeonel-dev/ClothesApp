import { Lock, LockOpen } from 'lucide-react'
import type { Categoria, Montagem } from '../types'
import { nomeCategoria } from '../types'
import { Icone } from './icones'
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
 * v1 da montagem: cada peça em seu espaço, numa grade de 2 colunas
 * (se sobrar um espaço ímpar, o último ocupa a largura toda).
 * Futuro: trocar por um canvas com peças recortadas e posicionáveis.
 */
export function OutfitBoard({ montagem, modoUnica, mostrarCasaco, mostrarAcessorio, onSlotClick, travadas, onToggleTrava }: Props) {
  const slots: Categoria[] = [
    ...(modoUnica ? (['pecaUnica'] as const) : (['cima', 'baixo'] as const)),
    'calcado',
    ...(mostrarCasaco ? (['casaco'] as const) : []),
    ...(mostrarAcessorio ? (['acessorio'] as const) : []),
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {slots.map((c, i) => {
        const item = montagem[c]
        const travada = travadas?.[c]
        const largo = slots.length % 2 === 1 && i === slots.length - 1
        return (
          <div
            key={c}
            className={`relative border bg-surface transition-colors ${travada ? 'border-ink' : 'border-line'} ${
              largo ? 'col-span-2 aspect-[5/2]' : 'aspect-[4/5]'
            }`}
          >
            <button
              type="button"
              disabled={!onSlotClick}
              onClick={() => onSlotClick?.(c)}
              className="flex h-full w-full items-center justify-center"
              aria-label={item ? `${nomeCategoria(c)}: ${item.nome || 'sem nome'}` : `Escolher ${nomeCategoria(c)}`}
            >
              {item ? (
                <BlobImg blob={item.foto} alt={item.nome || nomeCategoria(c)} className="h-full w-full object-contain p-2" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-muted">
                  <Icone nome={c} size={30} />
                  <span className="rotulo text-[9.5px]">{nomeCategoria(c)}</span>
                </span>
              )}
            </button>
            {item && <span className="rotulo pointer-events-none absolute bottom-2 left-2 text-[9px] text-muted">{nomeCategoria(c)}</span>}
            {onToggleTrava && item && (
              <button
                type="button"
                onClick={() => onToggleTrava(c)}
                aria-label={travada ? 'Destravar peça' : 'Travar peça'}
                aria-pressed={travada}
                className={`absolute right-0 top-0 flex h-9 w-9 items-center justify-center transition-colors ${
                  travada ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
                }`}
              >
                {travada ? <Lock size={15} strokeWidth={1.5} /> : <LockOpen size={15} strokeWidth={1.25} />}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
