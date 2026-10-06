import { useEffect, useState } from 'react'
import { ChipsMulti, Folha, botao } from './ui'
import { OCASIOES, ESTACOES } from '../types'

interface Props {
  aberta: boolean
  nomeInicial?: string
  tagsIniciais?: string[]
  onFechar: () => void
  onSalvar: (nome: string, tags: string[]) => void
}

export function SalvarLook({ aberta, nomeInicial = '', tagsIniciais = [], onFechar, onSalvar }: Props) {
  const [nome, setNome] = useState(nomeInicial)
  const [tags, setTags] = useState(tagsIniciais)

  useEffect(() => {
    if (aberta) {
      setNome(nomeInicial)
      setTags(tagsIniciais)
    }
  }, [aberta])

  return (
    <Folha aberta={aberta} onFechar={onFechar} titulo="Salvar look">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSalvar(nome.trim() || 'Look sem nome', tags)
        }}
        className="flex flex-col gap-4"
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nome
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Sexta no escritório"
            className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-brand-500"
          />
        </label>
        <div className="flex flex-col gap-2 text-sm font-medium">
          Etiquetas
          <ChipsMulti opcoes={[...OCASIOES, ...ESTACOES]} valor={tags} onChange={setTags} />
        </div>
        <button type="submit" className={botao.primario}>
          Salvar
        </button>
      </form>
    </Folha>
  )
}
