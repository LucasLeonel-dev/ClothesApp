import Dexie, { type EntityTable } from 'dexie'
import type { Item, Outfit } from '../types'

export const db = new Dexie('guarda-roupa') as Dexie & {
  items: EntityTable<Item, 'id'>
  outfits: EntityTable<Outfit, 'id'>
}

db.version(1).stores({
  items: 'id, categoria, criadoEm, *estacoes, *ocasioes',
  outfits: 'id, criadoEm, *itemIds',
})
