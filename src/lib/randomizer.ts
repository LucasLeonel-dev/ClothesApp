import type { Categoria, Item, Montagem } from '../types'

export interface Filtros {
  estacao?: string
  ocasiao?: string
}

export interface OpcoesSorteio {
  filtros: Filtros
  travadas: Montagem
  atual: Montagem
  incluirCasaco: boolean
  incluirAcessorio: boolean
}

/** Peça sem estação/ocasião marcada é considerada "serve para qualquer uma". */
export function combinaComFiltros(item: Item, f: Filtros) {
  const ok = (lista: string[], valor?: string) => !valor || lista.length === 0 || lista.includes(valor)
  return ok(item.estacoes, f.estacao) && ok(item.ocasioes, f.ocasiao)
}

/** Sorteia uma peça, evitando repetir a atual quando há alternativa. */
function sortear(lista: Item[], evitar?: Item): Item | undefined {
  const pool = lista.length > 1 && evitar ? lista.filter((i) => i.id !== evitar.id) : lista
  return pool[Math.floor(Math.random() * pool.length)]
}

export function sortearLook(items: Item[], o: OpcoesSorteio): { look: Montagem; faltando: Categoria[] } {
  const candidatos = (c: Categoria) => items.filter((i) => i.categoria === c && combinaComFiltros(i, o.filtros))
  const look: Montagem = {}
  const faltando: Categoria[] = []

  const escolher = (c: Categoria) => {
    const travada = o.travadas[c]
    if (travada) {
      look[c] = travada
      return
    }
    const escolhida = sortear(candidatos(c), o.atual[c])
    if (escolhida) look[c] = escolhida
    else faltando.push(c)
  }

  // Base: peça única (vestido/macacão) OU parte de cima + parte de baixo
  const nUnica = candidatos('pecaUnica').length
  const nDuas = Math.min(candidatos('cima').length, candidatos('baixo').length)
  let usarUnica: boolean
  if (o.travadas.pecaUnica) usarUnica = true
  else if (o.travadas.cima || o.travadas.baixo) usarUnica = false
  else if (nUnica === 0) usarUnica = false
  else if (nDuas === 0) usarUnica = true
  else usarUnica = Math.random() < nUnica / (nUnica + nDuas)

  if (usarUnica) escolher('pecaUnica')
  else {
    escolher('cima')
    escolher('baixo')
  }
  escolher('calcado')
  if (o.incluirCasaco || o.travadas.casaco) escolher('casaco')
  if (o.incluirAcessorio || o.travadas.acessorio) escolher('acessorio')

  return { look, faltando }
}
