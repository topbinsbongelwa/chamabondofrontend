import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { getDisplayName, getInitials, logout } from '../../lib/auth'
import { getRoleLabel } from '../../lib/roles'
import { Crest } from '../Crest'
import { CloseIcon, LogoutIcon, MenuIcon } from '../icons'
import { ADMIN_LINKS, Sidebar, TEACHER_LINKS } from './Sidebar'

interface DashboardLayoutProps {
  variant?: 'teacher' | 'admin'
}

export function DashboardLayout({ variant = 'teacher' }: DashboardLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const teacherName = getDisplayName()
  const initials = getInitials(teacherName)
  const roleLabel = getRoleLabel()
  const isAdminView = variant === 'admin'
  const homePath = isAdminView ? '/admin' : '/'
  const portalLabel = isAdminView ? 'Admin Portal' : 'Teacher Portal'
  const navLinks = isAdminView ? ADMIN_LINKS : TEACHER_LINKS

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="h-0.5 w-full bg-gradient-to-r from-primary via-gold to-primary" />
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-sidebar"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-primary/30 hover:bg-primary-50 hover:text-primary lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <Link to={homePath} className="flex min-w-0 items-center gap-2.5">
            <Crest className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-slate-900 sm:text-base">
                Chamabondo
              </p>
              <p className="hidden truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:block">
                {portalLabel}
              </p>
            </div>
          </Link>

          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="min-w-0 text-right">
              <Link
                to="/account"
                aria-label="Open account settings"
                className="block max-w-[88px] truncate text-xs font-semibold text-slate-800 transition hover:text-primary sm:max-w-[180px] sm:text-sm"
              >
                {teacherName}
              </Link>
              <p className="hidden text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:block">
                {roleLabel}
              </p>
            </div>

            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary ring-1 ring-inset ring-primary/10 sm:hidden"
              aria-hidden="true"
            >
              {initials}
            </span>

            <button
              type="button"
              onClick={logout}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 sm:px-3.5"
            >
              <LogoutIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Log out</span>
              <span className="sr-only sm:hidden">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto border-r border-slate-200 bg-white px-3 py-6">
            <Sidebar links={navLinks} />
            <div className="mt-8 rounded-xl border border-gold/30 bg-gold/5 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-700">
                {isAdminView ? 'Staff oversight' : 'Chamabondo Primary'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {isAdminView
                  ? 'Review staff profiles, attendance and monthly records.'
                  : 'Staff portal for attendance, KRAs, scheme books and school activities.'}
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <div
            id="mobile-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="animate-fade-in absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
              <Link
                to={homePath}
                onClick={() => setMenuOpen(false)}
                className="flex min-w-0 items-center gap-2.5"
              >
                <Crest className="h-8 w-8" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    Chamabondo
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {portalLabel}
                  </p>
                </div>
              </Link>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-slate-100 p-4">
              <div className="flex items-center gap-3 rounded-xl bg-primary-50 p-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {teacherName}
                  </p>
                  <p className="text-xs text-slate-500">{roleLabel}</p>
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="mt-1 inline-flex text-xs font-semibold text-primary hover:text-primary-700"
                  >
                    Account settings
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <Sidebar
                links={navLinks}
                onNavigate={() => setMenuOpen(false)}
              />
            </div>

            <div className="border-t border-slate-100 p-4">
              <button
                type="button"
                onClick={logout}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogoutIcon className="h-5 w-5" />
                Log out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
