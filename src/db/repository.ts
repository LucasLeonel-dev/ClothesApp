/**
 * Camada de dados. Hoje tudo fica no aparelho (IndexedDB via Dexie).
 * Para migrar para a nuvem, basta reimplementar estas funções/hooks
 * (ex.: Supabase) mantendo as mesmas assinaturas: as telas não mudam.
 */
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './schema'
import type { Item, Outfit } from '../types'
import { blobToDataUrl, dataUrlToBlob } from '../lib/image'

export const novoId = () => crypto.randomUUID()

// ---------- Peças ----------
export const useItems = () => useLiveQuery(() => db.items.orderBy('criadoEm').reverse().toArray(), [])
export const useItem = (id?: string) => useLiveQuery(() => (id ? db.items.get(id) : undefined), [id])

export const salvarItem = (item: Item) => db.items.put(item)

export async function excluirItem(id: string) {
  await db.transaction('rw', db.items, db.outfits, async () => {
    await db.items.delete(id)
    const afetados = await db.outfits.where('itemIds').equals(id).toArray()
    for (const o of afetados) {
      const itemIds = o.itemIds.filter((x) => x !== id)
      if (itemIds.length === 0) await db.outfits.delete(o.id)
      else await db.outfits.update(o.id, { itemIds })
    }
  })
}

// ---------- Looks ----------
export const useOutfits = () => useLiveQuery(() => db.outfits.orderBy('criadoEm').reverse().toArray(), [])
export const useOutfit = (id?: string) => useLiveQuery(() => (id ? db.outfits.get(id) : undefined), [id])
export const salvarOutfit = (o: Outfit) => db.outfits.put(o)
export const excluirOutfit = (id: string) => db.outfits.delete(id)

// ---------- Backup ----------
interface BackupItem extends Omit<Item, 'foto' | 'thumb'> {
  foto: string
  thumb: string
}
interface Backup {
  app: 'guarda-roupa'
  versao: 1
  exportadoEm: string
  items: BackupItem[]
  outfits: Outfit[]
}

export async function exportarBackup(): Promise<Blob> {
  const items = await db.items.toArray()
  const backup: Backup = {
    app: 'guarda-roupa',
    versao: 1,
    exportadoEm: new Date().toISOString(),
    items: await Promise.all(
      items.map(async (i) => ({ ...i, foto: await blobToDataUrl(i.foto), thumb: await blobToDataUrl(i.thumb) })),
    ),
    outfits: await db.outfits.toArray(),
  }
  return new Blob([JSON.stringify(backup)], { type: 'application/json' })
}

export async function importarBackup(arquivo: File) {
  const dados = JSON.parse(await arquivo.text()) as Backup
  if (dados.app !== 'guarda-roupa') throw new Error('Este arquivo não é um backup do Guarda-Roupa.')
  const items: Item[] = await Promise.all(
    dados.items.map(async (i) => ({ ...i, foto: await dataUrlToBlob(i.foto), thumb: await dataUrlToBlob(i.thumb) })),
  )
  await db.transaction('rw', db.items, db.outfits, async () => {
    await db.items.bulkPut(items)
    await db.outfits.bulkPut(dados.outfits)
  })
  return { pecas: items.length, looks: dados.outfits.length }
}

export async function apagarTudo() {
  await db.transaction('rw', db.items, db.outfits, async () => {
    await db.items.clear()
    await db.outfits.clear()
  })
}
