import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, X } from 'lucide-react'

/** Mostra uma imagem guardada como Blob no IndexedDB. */
export function BlobImg({ blob, alt, className }: { blob?: Blob; alt: string; className?: string }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return setUrl(undefined)
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url ? <img src={url} alt={alt} className={className} draggable={false} /> : null
}

export function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rotulo inline-flex shrink-0 items-center gap-1.5 border px-3 py-2 transition-colors ${
        ativo ? 'border-ink bg-ink text-bg' : 'border-line text-ink hover:border-ink'
      }`}
    >
      {children}
    </button>
  )
}

/** Lista de chips com seleção múltipla. */
export function ChipsMulti({ opcoes, valor, onChange }: { opcoes: string[]; valor: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <Chip key={o} ativo={valor.includes(o)} onClick={() => onChange(valor.includes(o) ? valor.filter((x) => x !== o) : [...valor, o])}>
          {o}
        </Chip>
      ))}
    </div>
  )
}

/** Lista de chips com seleção única, com opção "Qualquer". */
export function ChipsUnico({ opcoes, valor, onChange }: { opcoes: string[]; valor?: string; onChange: (v?: string) => void }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
      <Chip ativo={!valor} onClick={() => onChange(undefined)}>
        Qualquer
      </Chip>
      {opcoes.map((o) => (
        <Chip key={o} ativo={valor === o} onClick={() => onChange(valor === o ? undefined : o)}>
          {o}
        </Chip>
      ))}
    </div>
  )
}

/** Abas de texto sublinhadas (filtros editoriais). */
export function Abas<T extends string>({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: { id: T | undefined; nome: string; extra?: ReactNode }[]
  valor: T | undefined
  onChange: (v: T | undefined) => void
}) {
  return (
    <div className="-mx-4 flex gap-5 overflow-x-auto border-b border-line px-4 [scrollbar-width:none]">
      {opcoes.map((o) => {
        const ativo = o.id === valor
        return (
          <button
            key={o.id ?? 'todas'}
            onClick={() => onChange(o.id)}
            className={`rotulo -mb-px shrink-0 border-b py-3 transition-colors ${
              ativo ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {o.nome}
            {o.extra}
          </button>
        )
      })}
    </div>
  )
}

export function Voltar() {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(-1)} className="-ml-2 p-2" aria-label="Voltar">
      <ChevronLeft size={22} strokeWidth={1.25} />
    </button>
  )
}

export function Cabecalho({ titulo, sobretitulo, direita, voltar }: { titulo: string; sobretitulo?: string; direita?: ReactNode; voltar?: boolean }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/95 px-4 pb-3 pt-4 backdrop-blur">
      <div className="flex items-end gap-1">
        {voltar && <Voltar />}
        <div className="min-w-0 flex-1">
          {sobretitulo && <p className="rotulo text-muted">{sobretitulo}</p>}
          <h1 className="truncate font-serif text-[28px] leading-tight">{titulo}</h1>
        </div>
        {direita}
      </div>
    </header>
  )
}

export function Folha({ aberta, onFechar, titulo, children }: { aberta: boolean; onFechar: () => void; titulo: string; children: ReactNode }) {
  if (!aberta) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center" onClick={onFechar}>
      <div
        role="dialog"
        aria-label={titulo}
        className="flex max-h-[85vh] w-full max-w-lg flex-col border-t border-line bg-surface sm:border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-serif text-xl italic">{titulo}</h2>
          <button onClick={onFechar} className="-mr-2 p-2 text-muted hover:text-ink" aria-label="Fechar">
            <X size={20} strokeWidth={1.25} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

const baseBotao = 'rotulo inline-flex items-center justify-center gap-2 px-5 py-4 transition-opacity disabled:opacity-35'
export const botao = {
  primario: `${baseBotao} bg-ink text-bg hover:opacity-85`,
  secundario: `${baseBotao} border border-ink text-ink hover:bg-ink hover:text-bg`,
  perigo: `${baseBotao} border border-danger text-danger`,
  texto: 'rotulo underline decoration-line underline-offset-4 hover:decoration-ink',
}

/** Campo de texto editorial: só a linha de base. */
export const campo = 'w-full border-b border-line bg-transparent py-2.5 text-[15px] outline-none transition-colors focus:border-ink'

export function Secao({ titulo, dica, children }: { titulo: string; dica?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="rotulo">{titulo}</h2>
        {dica && <p className="mt-1 text-xs text-muted">{dica}</p>}
      </div>
      {children}
    </section>
  )
}

export function Vazio({ titulo, texto, acao }: { titulo: string; texto: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-20 text-center">
      <p className="font-serif text-3xl italic">{titulo}</p>
      <div className="my-5 h-px w-10 bg-ink" />
      <p className="max-w-xs text-sm leading-relaxed text-muted">{texto}</p>
      {acao && <div className="mt-8 flex gap-2">{acao}</div>}
    </div>
  )
}
