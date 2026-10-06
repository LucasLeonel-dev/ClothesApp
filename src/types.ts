export type Categoria = 'cima' | 'baixo' | 'pecaUnica' | 'calcado' | 'casaco' | 'acessorio'

export interface Item {
  id: string
  nome: string
  categoria: Categoria
  cores: string[]
  estacoes: string[]
  ocasioes: string[]
  foto: Blob
  thumb: Blob
  favorito: boolean
  criadoEm: number
}

export interface Outfit {
  id: string
  nome: string
  itemIds: string[]
  tags: string[]
  origem: 'manual' | 'aleatorio'
  criadoEm: number
}

/** Um look em montagem: no máximo uma peça por categoria. */
export type Montagem = Partial<Record<Categoria, Item>>

export const CATEGORIAS: { id: Categoria; nome: string; emoji: string }[] = [
  { id: 'cima', nome: 'Parte de cima', emoji: '👕' },
  { id: 'baixo', nome: 'Parte de baixo', emoji: '👖' },
  { id: 'pecaUnica', nome: 'Peça única', emoji: '👗' },
  { id: 'calcado', nome: 'Calçado', emoji: '👟' },
  { id: 'casaco', nome: 'Casaco', emoji: '🧥' },
  { id: 'acessorio', nome: 'Acessório', emoji: '👜' },
]

export const nomeCategoria = (c: Categoria) => CATEGORIAS.find((x) => x.id === c)!.nome
export const emojiCategoria = (c: Categoria) => CATEGORIAS.find((x) => x.id === c)!.emoji

export const ESTACOES = ['Verão', 'Outono', 'Inverno', 'Primavera']
export const OCASIOES = ['Casual', 'Trabalho', 'Festa', 'Esporte', 'Casa', 'Formal']
export const CORES: { nome: string; hex: string }[] = [
  { nome: 'Preto', hex: '#111827' },
  { nome: 'Branco', hex: '#ffffff' },
  { nome: 'Cinza', hex: '#9ca3af' },
  { nome: 'Bege', hex: '#e7d7b9' },
  { nome: 'Marrom', hex: '#7c4a2d' },
  { nome: 'Azul', hex: '#2563eb' },
  { nome: 'Jeans', hex: '#4b6c9c' },
  { nome: 'Verde', hex: '#16a34a' },
  { nome: 'Amarelo', hex: '#facc15' },
  { nome: 'Laranja', hex: '#f97316' },
  { nome: 'Vermelho', hex: '#dc2626' },
  { nome: 'Rosa', hex: '#f472b6' },
  { nome: 'Roxo', hex: '#7c3aed' },
  { nome: 'Estampado', hex: 'conic-gradient(#f472b6,#facc15,#2563eb,#16a34a,#f472b6)' },
]
