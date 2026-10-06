import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Armario } from './pages/Armario'
import { PecaForm } from './pages/PecaForm'
import { Montar } from './pages/Montar'
import { Sortear } from './pages/Sortear'
import { Looks } from './pages/Looks'
import { Ajustes } from './pages/Ajustes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Armario />} />
          <Route path="peca/nova" element={<PecaForm />} />
          <Route path="peca/:id" element={<PecaForm key="editar" />} />
          <Route path="montar" element={<Montar />} />
          <Route path="montar/:id" element={<Montar />} />
          <Route path="sortear" element={<Sortear />} />
          <Route path="looks" element={<Looks />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
