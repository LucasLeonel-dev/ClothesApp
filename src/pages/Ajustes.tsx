import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apagarTudo, exportarBackup, importarBackup, useItems, useOutfits } from '../db/repository'
import { baixarArquivo } from '../lib/image'
import { Cabecalho, botao } from '../components/ui'

export function Ajustes() {
  const navigate = useNavigate()
  const items = useItems()
  const outfits = useOutfits()
  const arquivo = useRef<HTMLInputElement>(null)
  const [espaco, setEspaco] = useState<string>()
  const [persistente, setPersistente] = useState<boolean>()
  const [ocupado, setOcupado] = useState(false)

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
      <Cabecalho
        titulo="Ajustes e backup"
        esquerda={
          <button onClick={() => navigate(-1)} className="-ml-2 rounded-full px-2 text-2xl" aria-label="Voltar">
            ‹
          </button>
        }
      />
      <div className="flex flex-col gap-6 p-4">
        <section className="rounded-2xl bg-white p-4 text-sm shadow-sm">
          <p>
            <b>{items?.length ?? 0}</b> peças · <b>{outfits?.length ?? 0}</b> looks {espaco && <>· {espaco} usados</>}
          </p>
          <p className="mt-2 text-slate-500">
            Tudo fica salvo só neste aparelho, dentro do navegador. Se você limpar os dados do navegador, as fotos se perdem,
            então faça backups de vez em quando.
          </p>
          {persistente === false && (
            <button
              onClick={() => navigator.storage.persist().then(setPersistente)}
              className="mt-3 text-sm font-medium text-brand-600"
            >
              Pedir ao navegador para não apagar meus dados automaticamente
            </button>
          )}
          {persistente && <p className="mt-2 text-xs text-green-700">✓ Armazenamento protegido contra limpeza automática</p>}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Backup</h2>
          <button onClick={exportar} disabled={ocupado} className={botao.primario}>
            ⬇️ Exportar backup (.json)
          </button>
          <button onClick={() => arquivo.current?.click()} disabled={ocupado} className={botao.secundario}>
            ⬆️ Importar backup
          </button>
          <input ref={arquivo} type="file" accept="application/json,.json" hidden onChange={importar} />
          <p className="text-xs text-slate-500">Use o backup também para passar seu armário do celular para o computador.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Zona de perigo</h2>
          <button onClick={apagar} className={botao.perigo}>
            Apagar tudo deste aparelho
          </button>
        </section>
      </div>
    </>
  )
}
