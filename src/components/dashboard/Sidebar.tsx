import { NavLink } from 'react-router-dom'
import {
  BookIcon,
  CalendarIcon,
  CheckIcon,
  DashboardIcon,
  NotebookIcon,
  TargetIcon,
} from '../icons'

const LINKS = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/attendance', label: 'Attendance', icon: CheckIcon },
  { to: '/kras', label: 'KRAs', icon: TargetIcon },
  { to: '/scheme-books', label: 'Scheme Books', icon: BookIcon },
  { to: '/logbook', label: 'Logbook', icon: NotebookIcon },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
]

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <nav aria-label="Main navigation" className="space-y-1.5">
      {LINKS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-primary-50 text-primary shadow-sm ring-1 ring-inset ring-primary/10'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-white'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="truncate">{label}</span>
              {isActive ? (
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-gold"
                  aria-hidden="true"
                />
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
