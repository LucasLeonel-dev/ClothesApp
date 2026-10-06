import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/bodoni-moda/400.css'
import '@fontsource/bodoni-moda/400-italic.css'
import '@fontsource/bodoni-moda/500.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import './index.css'
import { aplicarTema } from './lib/theme'
import App from './App.tsx'

aplicarTema()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
