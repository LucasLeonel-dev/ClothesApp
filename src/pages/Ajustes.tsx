import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apagarTudo, exportarBackup, importarBackup, useItems, useOutfits } from '../db/repository'
import { baixarArquivo } from '../lib/image'
import { Download, Monitor, Moon, Sun, Upload } from 'lucide-react'
import { getTema, setTema, type Tema } from '../lib/theme'
import { Cabecalho, Secao, botao } from '../components/ui'

const TEMAS: { id: Tema; nome: string; icone: React.ReactNode }[] = [
  { id: 'claro', nome: 'Claro', icone: <Sun size={18} strokeWidth={1.25} /> },
  { id: 'escuro', nome: 'Escuro', icone: <Moon size={18} strokeWidth={1.25} /> },
  { id: 'auto', nome: 'Automático', icone: <Monitor size={18} strokeWidth={1.25} /> },
]

export function Ajustes() {
  const navigate = useNavigate()
  const items = useItems()
  const outfits = useOutfits()
  const arquivo = useRef<HTMLInputElement>(null)
  const [espaco, setEspaco] = useState<string>()
  const [persistente, setPersistente] = useState<boolean>()
  const [ocupado, setOcupado] = useState(false)
  const [tema, setTemaAtual] = useState<Tema>(getTema)

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setEspaco(`${((e.usage ?? 0) / 1024 / 1024).toFixed(1)} MB`))
    navigator.storage?.persisted?.().then(setPersistente)
  }, [items, outfits])

  async function exportar() {
    setOcupado(true)
    try {
      const data = new Date().toISOString().slice(0, 10)
      baixarArquivo(await exportarBackup(), `guarda-roupa-backup-${data}.json`)
    } finally {
      setOcupado(false)
    }
  }

  async function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setOcupado(true)
    try {
      const r = await importarBackup(f)
      alert(`Backup restaurado: ${r.pecas} peças e ${r.looks} looks.`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível ler o arquivo.')
    } finally {
      setOcupado(false)
    }
  }

  async function apagar() {
    if (!confirm('Apagar TODAS as peças e looks deste aparelho? Isso não pode ser desfeito.')) return
    await apagarTudo()
    navigate('/')
  }

  return (
    <>
      <Cabecalho voltar sobretitulo="Expediente" titulo="Ajustes" />
      <div className="flex flex-col gap-10 p-4 pt-6">
        <Secao titulo="Aparência">
          <div className="grid grid-cols-3 border border-line" role="radiogroup" aria-label="Tema">
            {TEMAS.map((t, i) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={tema === t.id}
                onClick={() => {
                  setTema(t.id)
                  setTemaAtual(t.id)
                }}
                className={`flex flex-col items-center gap-2 py-4 transition-colors ${i > 0 ? 'border-l border-line' : ''} ${
                  tema === t.id ? 'bg-ink text-bg' : 'hover:bg-surface'
                }`}
              >
                {t.icone}
                <span className="rotulo text-[9px]">{t.nome}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">No automático, o app acompanha o tema claro/escuro do seu aparelho.</p>
        </Secao>

        <Secao titulo="Seu acervo">
          <div className="grid grid-cols-3 divide-x divide-line border-y border-line py-4 text-center">
            <Numero valor={items?.length ?? 0} legenda="peças" />
            <Numero valor={outfits?.length ?? 0} legenda="looks" />
            <div>
              <p className="font-serif text-3xl">{espaco?.replace(' MB', '') ?? '–'}</p>
              <p className="rotulo mt-1 text-[9px] text-muted">MB usados</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Tudo fica salvo só neste aparelho, dentro do navegador. Se os dados do navegador forem limpos, as fotos se perdem,
            então faça backups de vez em quando.
          </p>
          {persistente === false && (
            <button onClick={() => navigator.storage.persist().then(setPersistente)} className={`${botao.texto} self-start`}>
              Pedir ao navegador para não apagar meus dados
            </button>
          )}
          {persistente && <p className="rotulo text-[9px]">✓ Armazenamento protegido contra limpeza automática</p>}
        </Secao>

        <Secao titulo="Backup" dica="Use também para levar seu armário do celular para o computador.">
          <button onClick={exportar} disabled={ocupado} className={botao.primario}>
            <Download size={16} strokeWidth={1.25} /> Exportar backup
          </button>
          <button onClick={() => arquivo.current?.click()} disabled={ocupado} className={botao.secundario}>
            <Upload size={16} strokeWidth={1.25} /> Importar backup
          </button>
          <input ref={arquivo} type="file" accept="application/json,.json" hidden onChange={importar} />
        </Secao>

        <Secao titulo="Zona de perigo">
          <button onClick={apagar} className={botao.perigo}>
            Apagar tudo deste aparelho
          </button>
        </Secao>
      </div>
    </>
  )
}

function Numero({ valor, legenda }: { valor: number; legenda: string }) {
  return (
    <div>
      <p className="font-serif text-3xl">{String(valor).padStart(2, '0')}</p>
      <p className="rotulo mt-1 text-[9px] text-muted">{legenda}</p>
    </div>
  )
}
