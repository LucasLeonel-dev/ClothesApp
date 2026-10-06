import { useEffect, useState, type ReactNode } from 'react'

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
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition ${
        ativo ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-700'
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
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
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

export function Cabecalho({ titulo, direita, esquerda }: { titulo: string; direita?: ReactNode; esquerda?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-brand-100 bg-brand-50/90 px-4 backdrop-blur">
      {esquerda}
      <h1 className="flex-1 truncate text-lg font-semibold">{titulo}</h1>
      {direita}
    </header>
  )
}

export function Folha({ aberta, onFechar, titulo, children }: { aberta: boolean; onFechar: () => void; titulo: string; children: ReactNode }) {
  if (!aberta) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={onFechar}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-white sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold">{titulo}</h2>
          <button onClick={onFechar} className="rounded-full px-2 text-2xl leading-none text-slate-400" aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

export const botao = {
  primario: 'rounded-2xl bg-brand-600 px-4 py-3 font-medium text-white shadow-sm active:bg-brand-700 disabled:opacity-50',
  secundario: 'rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 active:bg-slate-50 disabled:opacity-50',
  perigo: 'rounded-2xl border border-red-200 bg-white px-4 py-3 font-medium text-red-600 active:bg-red-50',
}

export function Vazio({ emoji, titulo, texto, acao }: { emoji: string; titulo: string; texto: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <div className="mb-3 text-5xl">{emoji}</div>
      <p className="font-semibold">{titulo}</p>
      <p className="mt-1 text-sm text-slate-500">{texto}</p>
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  )
}
