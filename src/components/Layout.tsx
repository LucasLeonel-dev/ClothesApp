import { NavLink, Outlet } from 'react-router-dom'
import { Bookmark, Dices, Layers } from 'lucide-react'
import { Icone } from './icones'

const ABAS = [
  { to: '/', label: 'Armário', icone: <Icone nome="cabide" size={22} /> },
  { to: '/montar', label: 'Montar', icone: <Layers size={21} strokeWidth={1.25} /> },
  { to: '/sortear', label: 'Sortear', icone: <Dices size={21} strokeWidth={1.25} /> },
  { to: '/looks', label: 'Looks', icone: <Bookmark size={21} strokeWidth={1.25} /> },
]

export function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-lg">
          {ABAS.map((a) => (
            <NavLink
              key={a.to}
              to={a.to}
              end={a.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-1.5 pb-3 pt-3.5 transition-colors ${isActive ? 'text-ink' : 'text-muted hover:text-ink'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 h-px w-10 bg-ink" />}
                  {a.icone}
                  <span className="rotulo text-[9.5px]">{a.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
