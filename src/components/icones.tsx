import type { Categoria } from '../types'

/**
 * Ícones de traço fino desenhados para o app (a biblioteca de ícones não tem
 * calça, vestido nem cabide). Mesmo estilo dos ícones do lucide-react.
 */
const TRACOS: Record<Categoria | 'cabide', string> = {
  cima: 'M8.5 3.5 4 6.5l2 4 2-1V20.5h8V9.5l2 1 2-4-4.5-3c-.6 1.5-2 2.4-3.5 2.4S9.1 5 8.5 3.5Z',
  baixo: 'M7 3.5h10l1 17h-4l-2-10.5L10 20.5H6l1-17Z M7 7h10',
  pecaUnica: 'M9.5 3.5v3L8 9l2 1.5-4 10h12l-4-10L16 9l-1.5-2.5v-3 M8 9h8',
  calcado: 'M3 18.5V14l5-1.5 3-4.5 3.5 3c2 1.2 4.5 1.4 6.5 2.8v4.7Z M3 15.5h18',
  casaco: 'M9 3.5 4.5 6.5v14H10V9 M15 3.5l4.5 3v14H14V9 M9 3.5l3 4 3-4 M12 7.5v13',
  acessorio: 'M5 8.5h14l-1.2 12H6.2L5 8.5Z M9 8.5V7a3 3 0 0 1 6 0v1.5',
  cabide: 'M10 6.5a2 2 0 1 1 2 2v1.5L3 16.5c-.6.5-.3 1.5.5 1.5h17c.8 0 1.1-1 .5-1.5L12 10',
}

export function Icone({ nome, size = 22, className }: { nome: keyof typeof TRACOS; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={TRACOS[nome]} />
    </svg>
  )
}
