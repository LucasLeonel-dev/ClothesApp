import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { excluirOutfit, novoId, salvarOutfit, useItems, useOutfit } from '../db/repository'
import type { Categoria, Item, Montagem } from '../types'
import { OutfitBoard } from '../components/OutfitBoard'
import { ItemPicker } from '../components/ItemPicker'
import { SalvarLook } from '../components/SalvarLook'
import { Cabecalho, Chip, botao } from '../components/ui'

/** Montagem manual (/montar) e edição de um look salvo (/montar/:id). */
export function Montar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const items = useItems()
  const outfit = useOutfit(id)

  const [montagem, setMontagem] = useState<Montagem>({})
  const [modoUnica, setModoUnica] = useState(false)
  const [casaco, setCasaco] = useState(false)
  const [acessorio, setAcessorio] = useState(false)
  const [escolhendo, setEscolhendo] = useState<Categoria>()
  const [salvando, setSalvando] = useState(false)
  const carregado = useRef<string | undefined>(undefined)

  // Ao abrir um look salvo, carrega as peças dele
  useEffect(() => {
    if (!id) {
      if (carregado.current) {
        carregado.current = undefined
        setMontagem({})
        setModoUnica(false)
      }
      return
    }
    if (!outfit || !items || carregado.current === id) return
    carregado.current = id
    const m: Montagem = {}
    for (const itemId of outfit.itemIds) {
      const item = items.find((i) => i.id === itemId)
      if (item) m[item.categoria] = item
    }
    setMontagem(m)
    setModoUnica(!!m.pecaUnica)
    setCasaco(!!m.casaco)
    setAcessorio(!!m.acessorio)
  }, [id, outfit, items])

  function escolher(c: Categoria, item: Item | undefined) {
    setMontagem((m) => ({ ...m, [c]: item }))
    setEscolhendo(undefined)
  }

  function trocarModo(unica: boolean) {
    setModoUnica(unica)
    setMontagem((m) => (unica ? { ...m, cima: undefined, baixo: undefined } : { ...m, pecaUnica: undefined }))
  }

  const pecas = Object.values(montagem).filter(Boolean) as Item[]
  const visiveis = pecas.filter((p) => (p.categoria !== 'casaco' || casaco) && (p.categoria !== 'acessorio' || acessorio))

  async function salvar(nome: string, tags: string[]) {
    await salvarOutfit({
      id: outfit?.id ?? novoId(),
      nome,
      tags,
      itemIds: visiveis.map((p) => p.id),
      origem: outfit?.origem ?? 'manual',
      criadoEm: outfit?.criadoEm ?? Date.now(),
    })
    setSalvando(false)
    navigate('/looks')
  }

  async function excluir() {
    if (!outfit || !confirm('Excluir este look?')) return
    await excluirOutfit(outfit.id)
    navigate('/looks')
  }

  return (
    <>
      <Cabecalho voltar={!!id} sobretitulo={outfit ? 'Look salvo' : 'Ateliê'} titulo={outfit ? outfit.nome : 'Montar look'} />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap gap-2">
          <Chip ativo={!modoUnica} onClick={() => trocarModo(false)}>
            Duas peças
          </Chip>
          <Chip ativo={modoUnica} onClick={() => trocarModo(true)}>
            Peça única
          </Chip>
          <Chip ativo={casaco} onClick={() => setCasaco(!casaco)}>
            + Casaco
          </Chip>
          <Chip ativo={acessorio} onClick={() => setAcessorio(!acessorio)}>
            + Acessório
          </Chip>
        </div>

        <OutfitBoard
          montagem={montagem}
          modoUnica={modoUnica}
          mostrarCasaco={casaco}
          mostrarAcessorio={acessorio}
          onSlotClick={setEscolhendo}
        />
        <p className="text-center font-serif text-sm italic text-muted">Toque em um espaço para escolher a peça.</p>

        <button onClick={() => setSalvando(true)} disabled={visiveis.length === 0} className={botao.primario}>
          {outfit ? 'Salvar alterações' : 'Salvar look'}
        </button>
        {outfit && (
          <button onClick={excluir} className={botao.perigo}>
            Excluir look
          </button>
        )}
      </div>

      <ItemPicker
        categoria={escolhendo}
        selecionado={escolhendo && montagem[escolhendo]}
        onEscolher={(item) => escolhendo && escolher(escolhendo, item)}
        onFechar={() => setEscolhendo(undefined)}
      />
      <SalvarLook
        aberta={salvando}
        nomeInicial={outfit?.nome}
        tagsIniciais={outfit?.tags}
        onFechar={() => setSalvando(false)}
        onSalvar={salvar}
      />
    </>
  )
}
