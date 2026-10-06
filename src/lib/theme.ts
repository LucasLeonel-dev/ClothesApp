export type Tema = 'claro' | 'escuro' | 'auto'

const CHAVE = 'tema'
const COR_BARRA = { light: '#fafaf8', dark: '#0a0a0a' }
const sistemaEscuro = window.matchMedia('(prefers-color-scheme: dark)')

/** Preferência salva no aparelho (padrão: seguir o sistema). */
export function getTema(): Tema {
  try {
    const v = localStorage.getItem(CHAVE)
    if (v === 'claro' || v === 'escuro' || v === 'auto') return v
  } catch {
    // armazenamento indisponível (ex.: aba anônima): segue o sistema
  }
  return 'auto'
}

export function aplicarTema(tema: Tema = getTema()) {
  const modo = tema === 'escuro' || (tema === 'auto' && sistemaEscuro.matches) ? 'dark' : 'light'
  document.documentElement.dataset.theme = modo
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_BARRA[modo])
}

export function setTema(tema: Tema) {
  try {
    localStorage.setItem(CHAVE, tema)
  } catch {
    // sem armazenamento: vale só nesta sessão
  }
  aplicarTema(tema)
}

// No modo automático, acompanha a troca de tema do sistema em tempo real
sistemaEscuro.addEventListener('change', () => aplicarTema())
