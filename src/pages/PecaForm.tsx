import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { excluirItem, novoId, salvarItem, useItem } from '../db/repository'
import { prepararFoto } from '../lib/image'
import { CATEGORIAS, CORES, ESTACOES, OCASIOES, type Categoria } from '../types'
import { Camera, ImagePlus } from 'lucide-react'
import { Icone } from '../components/icones'
import { BlobImg, Cabecalho, ChipsMulti, Secao, botao, campo } from '../components/ui'

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
      <Cabecalho voltar sobretitulo={editando ? 'Armário' : 'Nova entrada'} titulo={editando ? existente?.nome || 'Editar peça' : 'Nova peça'} />
      <div className="flex flex-col gap-9 p-4 pt-6">
        {/* Foto */}
        <div className="flex flex-col gap-2">
          <div className="flex aspect-[4/5] items-center justify-center border border-line bg-surface">
            {processando ? (
              <span className="rotulo animate-pulse text-muted">Preparando foto…</span>
            ) : foto ? (
              <BlobImg blob={foto.foto} alt="Foto da peça" className="h-full w-full object-contain p-3" />
            ) : (
              <div className="flex flex-col items-center gap-4 px-10 text-center text-muted">
                <Icone nome="cabide" size={40} />
                <p className="font-serif text-lg italic text-ink">A peça em destaque</p>
                <p className="text-xs leading-relaxed">Estique a roupa sobre um fundo liso e claro, com boa luz e sem sombras.</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => camera.current?.click()} className={botao.primario}>
              <Camera size={16} strokeWidth={1.25} /> Tirar foto
            </button>
            <button type="button" onClick={() => galeria.current?.click()} className={botao.secundario}>
              <ImagePlus size={16} strokeWidth={1.25} /> Galeria
            </button>
          </div>
          <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={aoEscolherArquivo} />
          <input ref={galeria} type="file" accept="image/*" hidden onChange={aoEscolherArquivo} />
        </div>

        <Secao titulo="Nome">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Camisa de linho azul"
            className={`${campo} font-serif text-xl`}
          />
        </Secao>

        <Secao titulo="Categoria · obrigatória">
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIAS.map((c) => {
              const ativo = categoria === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoria(c.id)}
                  aria-pressed={ativo}
                  className={`flex flex-col items-center gap-2 border py-4 transition-colors ${
                    ativo ? 'border-ink bg-ink text-bg' : 'border-line hover:border-ink'
                  }`}
                >
                  <Icone nome={c.id} size={26} />
                  <span className="rotulo text-[8.5px]">{c.nome}</span>
                </button>
              )
            })}
          </div>
        </Secao>

        <Secao titulo="Cores" dica={cores.length > 0 ? cores.join(' · ') : 'Toque nas cores principais da peça'}>
          <div className="flex flex-wrap gap-2">
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
                  className={`h-8 w-8 border border-line outline-offset-2 ${ativo ? 'outline outline-1 outline-ink' : ''}`}
                  style={{ background: c.hex }}
                />
              )
            })}
          </div>
        </Secao>

        <Secao titulo="Estações" dica="Deixe vazio se serve para qualquer estação">
          <ChipsMulti opcoes={ESTACOES} valor={estacoes} onChange={setEstacoes} />
        </Secao>

        <Secao titulo="Ocasiões" dica="Deixe vazio se serve para qualquer ocasião">
          <ChipsMulti opcoes={OCASIOES} valor={ocasioes} onChange={setOcasioes} />
        </Secao>

        <div className="flex flex-col gap-2 border-t border-line pt-6">
          <button onClick={salvar} disabled={!foto || !categoria || processando} className={botao.primario}>
            {editando ? 'Salvar alterações' : 'Guardar no armário'}
          </button>
          {editando && (
            <button onClick={excluir} className={botao.perigo}>
              Excluir peça
            </button>
          )}
        </div>
      </div>
    </>
  )
}
