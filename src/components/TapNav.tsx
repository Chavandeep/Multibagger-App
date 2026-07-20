import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutGrid, Sparkles, BookMarked, Users, Radio, ChevronLeft, ChevronRight } from 'lucide-react'

const tiles = [
  { to: '/', label: 'Top 50', icon: LayoutGrid, end: true },
  { to: '/picks', label: 'Multibagger Picks', icon: Sparkles, end: false },
  { to: '/watchlist', label: 'Watchlist', icon: BookMarked, end: false },
  { to: '/smart-money', label: 'Smart Money', icon: Users, end: false },
  { to: '/macro', label: 'Macro Scan', icon: Radio, end: false },
]

const COLLAPSED_W = '5rem'
const EXPANDED_W = '14rem'
const STORAGE_KEY = 'yieldr-nav-collapsed'

export default function TapNav() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored != null) return stored === 'true'
    return window.innerWidth < 1024
  })

  useEffect(() => {
    document.documentElement.style.setProperty('--rail-w', collapsed ? COLLAPSED_W : EXPANDED_W)
    window.localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  return (
    <>
      {/* Mobile / small screens: fixed bottom tap-tile bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t md:hidden"
        style={{ borderColor: 'var(--color-paper-line)', background: 'var(--color-card)' }}
        aria-label="Main navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          {tiles.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `tap-tile flex flex-col items-center justify-center gap-1 py-2.5 px-0.5 border-r last:border-r-0 ${
                  isActive ? 'bg-[var(--color-ledger-green)]/[0.07]' : ''
                }`
              }
              style={{ borderColor: 'var(--color-paper-line)' }}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.4 : 1.8}
                    color={isActive ? 'var(--color-ledger-green)' : 'var(--color-ink-soft)'}
                  />
                  <span
                    className="text-[9.5px] font-medium tracking-tight text-center leading-tight"
                    style={{ color: isActive ? 'var(--color-ledger-green)' : 'var(--color-ink-soft)' }}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>

      {/* Tablet / desktop: fixed left rail, collapsible */}
      <nav
        className="hidden md:flex fixed top-0 left-0 bottom-0 z-20 flex-col border-r py-6 px-2 transition-[width] duration-300 ease-in-out"
        style={{ borderColor: 'var(--color-paper-line)', background: 'var(--color-card)', width: 'var(--rail-w, 5rem)' }}
        aria-label="Main navigation"
      >
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex items-center justify-center absolute top-8 rounded-full border shadow-sm tap-tile"
          style={{
            right: -12,
            width: 26,
            height: 26,
            background: 'var(--color-card)',
            borderColor: 'var(--color-paper-line)',
          }}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? (
            <ChevronRight size={14} color="var(--color-ink-soft)" />
          ) : (
            <ChevronLeft size={14} color="var(--color-ink-soft)" />
          )}
        </button>

        <div className="px-2 mb-6 h-[30px] flex items-center overflow-hidden">
          {!collapsed && (
            <p
              className="text-lg font-semibold leading-tight whitespace-nowrap"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ledger-green)' }}
            >
              Yieldr
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {tiles.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `tap-tile flex items-center gap-3 rounded-md px-3 py-2.5 overflow-hidden ${
                  isActive ? 'bg-[var(--color-ledger-green)]/[0.09]' : ''
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    className="shrink-0"
                    strokeWidth={isActive ? 2.4 : 1.8}
                    color={isActive ? 'var(--color-ledger-green)' : 'var(--color-ink-soft)'}
                  />
                  {!collapsed && (
                    <span
                      className="text-sm font-medium whitespace-nowrap"
                      style={{ color: isActive ? 'var(--color-ledger-green)' : 'var(--color-ink-soft)' }}
                    >
                      {label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
