import { NavLink, Outlet } from 'react-router-dom'

const ABAS = [
  { to: '/', label: 'Armário', icone: '🚪' },
  { to: '/montar', label: 'Montar', icone: '🧩' },
  { to: '/sortear', label: 'Sortear', icone: '🎲' },
  { to: '/looks', label: 'Looks', icone: '⭐' },
]

export function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-lg">
          {ABAS.map((a) => (
            <NavLink
              key={a.to}
              to={a.to}
              end={a.to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${isActive ? 'font-semibold text-brand-600' : 'text-slate-500'}`
              }
            >
              <span className="text-xl">{a.icone}</span>
              {a.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
