import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bookmark, Dices, LockOpen } from 'lucide-react'
import { novoId, salvarOutfit, useItems } from '../db/repository'
import { sortearLook, type Filtros } from '../lib/randomizer'
import { ESTACOES, OCASIOES, nomeCategoria, type Categoria, type Item, type Montagem } from '../types'
import { OutfitBoard } from '../components/OutfitBoard'
import { SalvarLook } from '../components/SalvarLook'
import { Cabecalho, Chip, ChipsUnico, Vazio, botao } from '../components/ui'

export function Sortear() {
  const items = useItems()
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<Filtros>({})
  const [casaco, setCasaco] = useState(false)
  const [acessorio, setAcessorio] = useState(false)
  const [look, setLook] = useState<Montagem>({})
  const [travadas, setTravadas] = useState<Partial<Record<Categoria, boolean>>>({})
  const [faltando, setFaltando] = useState<Categoria[]>([])
  const [salvando, setSalvando] = useState(false)
  const [girando, setGirando] = useState(false)

  function sortear() {
    if (!items) return
    const pecasTravadas: Montagem = {}
    for (const c of Object.keys(travadas) as Categoria[]) if (travadas[c] && look[c]) pecasTravadas[c] = look[c]
    const r = sortearLook(items, { filtros, travadas: pecasTravadas, atual: look, incluirCasaco: casaco, incluirAcessorio: acessorio })
    setLook(r.look)
    setFaltando(r.faltando)
    setGirando(true)
    setTimeout(() => setGirando(false), 250)
  }

  // Primeiro sorteio automático quando as peças carregam
  useEffect(() => {
    if (items?.length && Object.keys(look).length === 0) sortear()
  }, [items])

  async function salvar(nome: string, tags: string[]) {
    await salvarOutfit({
      id: novoId(),
      nome,
      tags,
      itemIds: (Object.values(look).filter(Boolean) as Item[]).map((i) => i.id),
      origem: 'aleatorio',
      criadoEm: Date.now(),
    })
    setSalvando(false)
    navigate('/looks')
  }

  if (items?.length === 0)
    return (
      <>
        <Cabecalho sobretitulo="Ao acaso" titulo="Sortear look" />
        <Vazio
          titulo="Nada para sortear ainda"
          texto="Adicione ao armário pelo menos uma parte de cima, uma de baixo e um calçado."
          acao={
            <Link to="/peca/nova" className={botao.primario}>
              Adicionar peça
            </Link>
          }
        />
      </>
    )

  const tags = [filtros.estacao, filtros.ocasiao].filter(Boolean) as string[]

  return (
    <>
      <Cabecalho sobretitulo="Ao acaso" titulo="Sortear look" />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <p className="rotulo text-muted">Estação</p>
            <ChipsUnico opcoes={ESTACOES} valor={filtros.estacao} onChange={(estacao) => setFiltros({ ...filtros, estacao })} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="rotulo text-muted">Ocasião</p>
            <ChipsUnico opcoes={OCASIOES} valor={filtros.ocasiao} onChange={(ocasiao) => setFiltros({ ...filtros, ocasiao })} />
          </div>
          <div className="flex gap-2">
            <Chip ativo={casaco} onClick={() => setCasaco(!casaco)}>
              + Casaco
            </Chip>
            <Chip ativo={acessorio} onClick={() => setAcessorio(!acessorio)}>
              + Acessório
            </Chip>
          </div>
        </div>

        <div className={`transition-opacity duration-200 ${girando ? 'opacity-30' : 'opacity-100'}`}>
          <OutfitBoard
            montagem={look}
            modoUnica={!!look.pecaUnica}
            mostrarCasaco={casaco || !!look.casaco}
            mostrarAcessorio={acessorio || !!look.acessorio}
            travadas={travadas}
            onToggleTrava={(c) => setTravadas({ ...travadas, [c]: !travadas[c] })}
          />
        </div>

        {faltando.length > 0 && (
          <p className="border-l border-danger pl-3 text-sm text-danger">
            Nenhuma peça encontrada para {faltando.map(nomeCategoria).join(', ').toLowerCase()}. Tente outros filtros ou adicione peças.
          </p>
        )}
        <p className="flex items-center justify-center gap-1.5 text-center font-serif text-sm italic text-muted">
          Toque no <LockOpen size={13} strokeWidth={1.5} className="inline" /> para manter uma peça e sortear só o resto.
        </p>

        {/* Ações sempre visíveis acima da barra de navegação */}
        <div className="sticky bottom-[78px] -mx-4 grid grid-cols-2 gap-2 bg-bg/95 px-4 py-2 backdrop-blur">
          <button onClick={sortear} className={botao.primario}>
            <Dices size={16} strokeWidth={1.25} /> Sortear
          </button>
          <button onClick={() => setSalvando(true)} disabled={Object.keys(look).length === 0} className={botao.secundario}>
            <Bookmark size={15} strokeWidth={1.25} /> Salvar
          </button>
        </div>
      </div>

      <SalvarLook aberta={salvando} tagsIniciais={tags} onFechar={() => setSalvando(false)} onSalvar={salvar} />
    </>
  )
}
