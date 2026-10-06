import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { excluirItem, novoId, salvarItem, useItem } from '../db/repository'
import { prepararFoto } from '../lib/image'
import { CATEGORIAS, CORES, ESTACOES, OCASIOES, type Categoria } from '../types'
import { BlobImg, Cabecalho, Chip, ChipsMulti, botao } from '../components/ui'

/** Cadastro (/peca/nova) e edição (/peca/:id) de uma peça. */
export function PecaForm() {
  const { id } = useParams()
  const editando = !!id
  const existente = useItem(id)
  const navigate = useNavigate()

  const [foto, setFoto] = useState<{ foto: Blob; thumb: Blob }>()
  const [processando, setProcessando] = useState(false)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<Categoria>()
  const [cores, setCores] = useState<string[]>([])
  const [estacoes, setEstacoes] = useState<string[]>([])
  const [ocasioes, setOcasioes] = useState<string[]>([])
  const carregado = useRef(false)

  useEffect(() => {
    if (existente && !carregado.current) {
      carregado.current = true
      setFoto({ foto: existente.foto, thumb: existente.thumb })
      setNome(existente.nome)
      setCategoria(existente.categoria)
      setCores(existente.cores)
      setEstacoes(existente.estacoes)
      setOcasioes(existente.ocasioes)
    }
  }, [existente])

  const camera = useRef<HTMLInputElement>(null)
  const galeria = useRef<HTMLInputElement>(null)

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    setProcessando(true)
    try {
      setFoto(await prepararFoto(arquivo))
    } catch {
      alert('Não foi possível ler esta imagem. Tente outra foto.')
    } finally {
      setProcessando(false)
    }
  }

  async function salvar() {
    if (!foto || !categoria) return
    await salvarItem({
      id: id ?? novoId(),
      nome: nome.trim(),
      categoria,
      cores,
      estacoes,
      ocasioes,
      foto: foto.foto,
      thumb: foto.thumb,
      favorito: existente?.favorito ?? false,
      criadoEm: existente?.criadoEm ?? Date.now(),
    })
    navigate('/')
  }

  async function excluir() {
    if (!id || !confirm('Excluir esta peça? Ela também sai dos looks salvos.')) return
    await excluirItem(id)
    navigate('/')
  }

  if (editando && existente === undefined && !carregado.current) return null

  return (
    <>
      <Cabecalho
        titulo={editando ? 'Editar peça' : 'Nova peça'}
        esquerda={
          <button onClick={() => navigate(-1)} className="-ml-2 rounded-full px-2 text-2xl" aria-label="Voltar">
            ‹
          </button>
        }
      />
      <div className="flex flex-col gap-6 p-4">
        {/* Foto */}
        <div className="flex flex-col gap-3">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-brand-100 bg-white">
            {processando ? (
              <span className="text-sm text-slate-500">Preparando foto…</span>
            ) : foto ? (
              <BlobImg blob={foto.foto} alt="Foto da peça" className="h-full w-full object-contain" />
            ) : (
              <span className="px-8 text-center text-sm text-slate-500">
                Coloque a peça esticada sobre um fundo liso e bem iluminado 📸
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => camera.current?.click()} className={botao.secundario}>
              📷 Tirar foto
            </button>
            <button type="button" onClick={() => galeria.current?.click()} className={botao.secundario}>
              🖼️ Galeria
            </button>
          </div>
          <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={aoEscolherArquivo} />
          <input ref={galeria} type="file" accept="image/*" hidden onChange={aoEscolherArquivo} />
        </div>

        <Campo titulo="Categoria *">
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
              <Chip key={c.id} ativo={categoria === c.id} onClick={() => setCategoria(c.id)}>
                {c.emoji} {c.nome}
              </Chip>
            ))}
          </div>
        </Campo>

        <Campo titulo="Nome (opcional)">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Camisa de linho azul"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-brand-500"
          />
        </Campo>

        <Campo titulo="Cores">
          <div className="flex flex-wrap gap-2.5">
            {CORES.map((c) => {
              const ativo = cores.includes(c.nome)
              return (
                <button
                  key={c.nome}
                  type="button"
                  title={c.nome}
                  aria-label={c.nome}
                  aria-pressed={ativo}
                  onClick={() => setCores(ativo ? cores.filter((x) => x !== c.nome) : [...cores, c.nome])}
                  className={`h-9 w-9 rounded-full border border-slate-300 ${ativo ? 'ring-2 ring-brand-600 ring-offset-2' : ''}`}
                  style={{ background: c.hex }}
                />
              )
            })}
          </div>
          {cores.length > 0 && <p className="text-xs text-slate-500">{cores.join(', ')}</p>}
        </Campo>

        <Campo titulo="Estações" dica="Deixe vazio se serve para qualquer estação">
          <ChipsMulti opcoes={ESTACOES} valor={estacoes} onChange={setEstacoes} />
        </Campo>

        <Campo titulo="Ocasiões" dica="Deixe vazio se serve para qualquer ocasião">
          <ChipsMulti opcoes={OCASIOES} valor={ocasioes} onChange={setOcasioes} />
        </Campo>

        <button onClick={salvar} disabled={!foto || !categoria || processando} className={botao.primario}>
          {editando ? 'Salvar alterações' : 'Guardar no armário'}
        </button>
        {editando && (
          <button onClick={excluir} className={botao.perigo}>
            Excluir peça
          </button>
        )}
      </div>
    </>
  )
}

function Campo({ titulo, dica, children }: { titulo: string; dica?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-semibold">{titulo}</p>
        {dica && <p className="text-xs text-slate-500">{dica}</p>}
      </div>
      {children}
    </div>
  )
}
