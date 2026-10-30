import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useChat } from '../../hooks/useChat'
import { CloseIcon, MenuIcon, PlusIcon, SparklesIcon } from '../icons'

const ChatPanel = lazy(() =>
  import('./ChatPanel').then((module) => ({ default: module.ChatPanel })),
)

export function FloatingAssistant() {
  const location = useLocation()
  const chat = useChat()
  const [open, setOpen] = useState(false)
  const [labelVisible, setLabelVisible] = useState(false)
  const [labelDismissed, setLabelDismissed] = useState(() => localStorage.getItem('chamabondo_ai_label_dismissed') === 'true')
  const pageName = useMemo(() => {
    const current = location.pathname.split('/').filter(Boolean).pop() ?? 'Dashboard'
    const names: Record<string, string> = { kras: 'KRAs', attendance: 'Attendance', calendar: 'Calendar', 'scheme-books': 'Scheme Books', 'ai-assistant': 'AI Assistant', staff: 'Staff', reports: 'Reports' }
    return names[current] ?? (current ? current[0].toUpperCase() + current.slice(1) : 'Dashboard')
  }, [location.pathname])

  useEffect(() => {
    if (labelDismissed || location.pathname === '/ai-assistant') return
    const timer = window.setTimeout(() => setLabelVisible(true), 3500)
    return () => window.clearTimeout(timer)
  }, [labelDismissed, location.pathname])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  if (location.pathname === '/ai-assistant') return null

  return (
    <>
      <div className="fixed bottom-24 right-4 z-40 flex items-center gap-2 sm:bottom-6 sm:right-6">
        {labelVisible && !labelDismissed && !open ? <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-lg">
          <span>Ask Intelli AI</span><button type="button" aria-label="Dismiss assistant tip" onClick={() => { setLabelVisible(false); setLabelDismissed(true); localStorage.setItem('chamabondo_ai_label_dismissed', 'true') }} className="ml-1 text-slate-400 hover:text-slate-800"><CloseIcon className="h-3.5 w-3.5" /></button>
        </div> : null}
        <button type="button" aria-label={open ? 'Close Intelli AI' : 'Open Intelli AI'} aria-expanded={open} onClick={() => setOpen((current) => !current)} className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl ring-4 ring-white transition hover:scale-105 hover:bg-primary-700">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" aria-hidden="true" />
          <SparklesIcon className="relative h-7 w-7 text-gold" />
          {!open ? <span aria-hidden="true" className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-gold" /> : null}
        </button>
      </div>
      {open ? <>
        <button type="button" aria-label="Close Intelli AI chat" onClick={() => setOpen(false)} className="fixed inset-0 z-[60] bg-slate-950/45 sm:hidden" />
        <section aria-label="Intelli AI quick chat" className="fixed inset-0 z-[70] flex flex-col bg-white sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[560px] sm:max-h-[calc(100vh-48px)] sm:w-[380px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-2xl">
          <header className="flex min-h-14 items-center gap-2 border-b border-slate-200 px-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-gold"><SparklesIcon className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">Intelli AI</p><p className="truncate text-[10px] text-slate-400">Here to help with {pageName}</p></div>
            <button type="button" aria-label="Start a new chat" onClick={() => chat.newConversation()} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><PlusIcon className="h-4 w-4" /></button>
            <Link to="/ai-assistant" onClick={() => setOpen(false)} aria-label="Open full assistant" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><MenuIcon className="h-4 w-4" /></Link>
            <button type="button" aria-label="Minimise chat" onClick={() => setOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><CloseIcon className="h-4 w-4" /></button>
          </header>
          <Suspense fallback={<div className="flex flex-1 items-center justify-center text-xs text-slate-500">Loading Intelli AI…</div>}>
            <ChatPanel compact context={pageName} />
          </Suspense>
        </section>
      </> : null}
    </>
  )
}
