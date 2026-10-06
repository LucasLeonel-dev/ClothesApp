import imageCompression from 'browser-image-compression'

/** Reduz a foto para guardar no aparelho sem ocupar muito espaço. */
export async function prepararFoto(arquivo: File) {
  const base = { useWebWorker: true, fileType: 'image/jpeg' }
  const [foto, thumb] = await Promise.all([
    imageCompression(arquivo, { ...base, maxWidthOrHeight: 1080, maxSizeMB: 0.4, initialQuality: 0.85 }),
    imageCompression(arquivo, { ...base, maxWidthOrHeight: 360, maxSizeMB: 0.05, initialQuality: 0.8 }),
  ])
  return { foto: foto as Blob, thumb: thumb as Blob }
}

export const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = () => rej(r.error)
    r.readAsDataURL(b)
  })

export const dataUrlToBlob = async (url: string) => (await fetch(url)).blob()

export function baixarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
