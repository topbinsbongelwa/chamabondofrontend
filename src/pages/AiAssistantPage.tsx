import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { startCheckout, createShareLink, fetchModels, readProjects, newProjectId, persistProjects, stopSharing } from '../ai/api'
import { AI_TONES } from '../ai/constants'
import type { AiProject } from '../ai/types'
import { ChatPanel } from '../components/ai/ChatPanel'
import { useChat } from '../hooks/useChat'
import { getCurrentUser, getDisplayName } from '../lib/auth'
import {
  BookIcon,
  CloseIcon,
  MenuIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  SparklesIcon,
  TrashIcon,
} from '../components/icons'

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getHistoryGroup(value: string): 'Today' | 'Yesterday' | 'Previous 7 days' | 'Older' {
  const date = new Date(value)
  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const difference = Math.floor((startToday - startDate) / 86_400_000)
  if (difference <= 0) return 'Today'
  if (difference === 1) return 'Yesterday'
  if (difference <= 7) return 'Previous 7 days'
  return 'Older'
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  onCloseRef.current = onClose
  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ))
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', keyDown)
    return () => {
      window.removeEventListener('keydown', keyDown)
      previousFocusRef.current?.focus()
    }
  }, [])
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={modalRef} role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button ref={closeRef} type="button" aria-label="Close dialog" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><CloseIcon className="h-5 w-5" /></button>
        </div>
        {children}
      </section>
    </div>
  )
}

export function AiAssistantPage() {
  const chat = useChat()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [models, setModels] = useState(['Auto'])
  const [modelsError, setModelsError] = useState('')
  const [projects, setProjects] = useState<AiProject[]>(readProjects)
  const [projectFilter, setProjectFilter] = useState<string | null>(null)
  const [projectModal, setProjectModal] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [schemeOpen, setSchemeOpen] = useState(false)
  const [shareError, setShareError] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [shareCopied, setShareCopied] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectInstructions, setProjectInstructions] = useState('')
  const [schemeMessage, setSchemeMessage] = useState('')
  const user = getCurrentUser()
  const isPro = /pro|paid|premium/i.test(user?.plan ?? user?.subscriptionPlan ?? '')
  const pageName = useMemo(() => {
    const path = location.pathname.split('/').filter(Boolean).pop() ?? 'Dashboard'
    const titles: Record<string, string> = { kras: 'KRAs', attendance: 'Attendance', calendar: 'Calendar', 'scheme-books': 'Scheme Books', 'ai-assistant': 'AI Assistant', staff: 'Staff', reports: 'Reports' }
    return titles[path] ?? (path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard')
  }, [location.pathname])
  const activeChatTitle = chat.activeChat?.title ?? 'New chat'
  const visibleChats = chat.chats
    .filter((item) => !projectFilter || item.projectId === projectFilter)
    .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()) || item.messages.some((message) => message.content.toLowerCase().includes(search.toLowerCase())))
    .sort((first, second) => Number(Boolean(second.pinned)) - Number(Boolean(first.pinned)) || new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime())

  useEffect(() => {
    fetchModels().then((items) => setModels(['Auto', ...items.filter((model) => model.toLowerCase() !== 'auto')]))
      .catch((error: unknown) => setModelsError(error instanceof Error ? error.message : 'Could not load AI models.'))
  }, [])

  useEffect(() => {
    if (new URLSearchParams(location.search).get('upgrade') === '1') setUpgradeOpen(true)
  }, [location.search])

  useEffect(() => {
    persistProjects(projects)
  }, [projects])

  const groups = ['Today', 'Yesterday', 'Previous 7 days', 'Older'] as const
  const onRenameChat = (id: string, title: string) => {
    const nextTitle = window.prompt('Rename chat', title)
    if (nextTitle?.trim()) chat.updateChat(id, { title: nextTitle.trim() })
  }
  const onDeleteChat = (id: string, title: string) => {
    if (window.confirm(`Delete “${title}”? This cannot be undone.`)) chat.removeChat(id)
  }
  const createProject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = projectName.trim()
    if (!name) return
    const project = { id: newProjectId(), name, description: projectDescription.trim(), instructions: projectInstructions.trim() }
    setProjects((current) => [...current, project])
    setProjectName('')
    setProjectDescription('')
    setProjectInstructions('')
    setProjectModal(false)
    setProjectFilter(project.id)
  }
  const doShare = async () => {
    if (!chat.activeChat) return
    setShareError('')
    setShareLoading(true)
    try {
      const url = await createShareLink(chat.activeChat.id)
      chat.updateChat(chat.activeChat.id, { shareUrl: url })
    } catch (error) {
      setShareError(error instanceof Error ? error.message : 'Could not create a share link.')
    } finally {
      setShareLoading(false)
    }
  }
  const copyShareLink = async () => {
    if (!chat.activeChat?.shareUrl) return
    try {
      await navigator.clipboard.writeText(chat.activeChat.shareUrl)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 1800)
    } catch {
      setShareError('Clipboard access is not available in this browser.')
    }
  }
  const disableSharing = async () => {
    if (!chat.activeChat) return
    setShareError('')
    try {
      await stopSharing(chat.activeChat.id)
      chat.updateChat(chat.activeChat.id, { shareUrl: undefined })
    } catch (error) {
      setShareError(error instanceof Error ? error.message : 'Could not stop sharing.')
    }
  }
  const doCheckout = async () => {
    setCheckoutError('')
    setCheckoutLoading(true)
    try {
      window.location.assign(await startCheckout())
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Could not start checkout.')
      setCheckoutLoading(false)
    }
  }
  const submitScheme = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSchemeMessage('Scheme generation will be available when the Intelli AI service is connected.')
  }

  return (
    <div className="-mx-4 -my-5 flex h-[calc(100vh-64px)] min-h-[540px] overflow-hidden bg-white sm:-mx-6 sm:-my-7 lg:-mx-8 lg:-my-8">
      {drawerOpen ? <button type="button" aria-label="Close chat history" onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" /> : null}
      <aside className={`${drawerOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden'} w-[290px] shrink-0 flex-col border-r border-slate-200 bg-slate-50 lg:static lg:flex lg:w-[280px]`}>
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-3">
          <Link to="/" className="flex min-w-0 items-center gap-2 text-primary">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white"><SparklesIcon className="h-5 w-5" /></span>
            <span className="truncate text-sm font-bold text-slate-900">Intelli AI</span>
          </Link>
          <button type="button" aria-label="Close chat drawer" onClick={() => setDrawerOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-white lg:hidden"><CloseIcon className="h-5 w-5" /></button>
        </div>
        <div className="space-y-2 p-3">
          <button type="button" onClick={() => { chat.newConversation(projectFilter ?? undefined); setDrawerOpen(false); setSchemeOpen(false) }} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"><PlusIcon className="h-4 w-4" /> New chat</button>
          <label className="relative block">
            <span className="sr-only">Search chat history</span>
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats" className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-primary" />
          </label>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-3">
          <section aria-label="Chat history">
            <div className="flex items-center justify-between px-2 py-1">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{projectFilter ? projects.find((project) => project.id === projectFilter)?.name ?? 'Project chats' : 'Chat history'}</h2>
              {projectFilter ? <button type="button" onClick={() => setProjectFilter(null)} className="text-[10px] font-semibold text-primary">All chats</button> : null}
            </div>
            {visibleChats.some((item) => item.pinned) ? <div className="mb-2">
              <p className="px-2 py-1 text-[10px] font-semibold text-gold-700">Pinned</p>
              {visibleChats.filter((item) => item.pinned).map((item) => <ChatHistoryItem key={item.id} item={item} active={item.id === chat.activeChatId} onSelect={() => { chat.selectChat(item.id); setDrawerOpen(false); setSchemeOpen(false) }} onPin={() => chat.updateChat(item.id, { pinned: false })} onRename={() => onRenameChat(item.id, item.title)} onDelete={() => onDeleteChat(item.id, item.title)} />)}
            </div> : null}
            {groups.map((group) => {
              const items = visibleChats.filter((item) => !item.pinned && getHistoryGroup(item.updatedAt) === group)
              return items.length ? <div key={group} className="mb-2"><p className="px-2 py-1 text-[10px] font-semibold text-slate-400">{group}</p>{items.map((item) => <ChatHistoryItem key={item.id} item={item} active={item.id === chat.activeChatId} onSelect={() => { chat.selectChat(item.id); setDrawerOpen(false); setSchemeOpen(false) }} onPin={() => chat.updateChat(item.id, { pinned: true })} onRename={() => onRenameChat(item.id, item.title)} onDelete={() => onDeleteChat(item.id, item.title)} />)}</div> : null
            })}
            {visibleChats.length === 0 ? <p className="px-3 py-4 text-xs text-slate-400">{chat.loading ? 'Loading chats…' : 'No chats found.'}</p> : null}
          </section>
          {!projectFilter ? <section aria-label="Projects">
            <div className="flex items-center justify-between px-2 py-1"><h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Projects</h2><button type="button" aria-label="Create project" onClick={() => setProjectModal(true)} className="rounded p-1 text-slate-500 hover:bg-white hover:text-primary"><PlusIcon className="h-4 w-4" /></button></div>
            {projects.map((project) => <button type="button" key={project.id} onClick={() => { setProjectFilter(project.id); const existing = chat.chats.find((item) => item.projectId === project.id); if (existing) chat.selectChat(existing.id); else chat.newConversation(project.id); setDrawerOpen(false); setSchemeOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-white"><BookIcon className="h-4 w-4 text-primary" /><span className="min-w-0 flex-1 truncate">{project.name}</span><span className="text-[10px] text-slate-400">{chat.chats.filter((item) => item.projectId === project.id).length}</span></button>)}
          </section> : null}
          <section aria-label="Assistant features">
            <h2 className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Tools</h2>
            <button type="button" onClick={() => isPro ? setSchemeOpen(true) : setUpgradeOpen(true)} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-white">
              <span className="text-gold-700"><BookIcon className="h-4 w-4" /></span><span className="flex-1">Scheme Generator</span>{!isPro ? <><span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold text-gold-700">Upgrade</span><span aria-label="Locked">🔒</span></> : null}
            </button>
            <button type="button" onClick={() => setSettingsOpen(true)} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-white"><span className="text-slate-500">⚙</span> Customize</button>
          </section>
        </div>
        <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-3">
          <div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{getDisplayName()}</p><p className="text-[10px] text-slate-400">Teacher account</p></div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isPro ? 'bg-gold/20 text-gold-700' : 'bg-slate-100 text-slate-600'}`}>{isPro ? 'Pro' : 'Free'}</span>
        </footer>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[56px] items-center gap-2 border-b border-slate-200 px-3 sm:px-5">
          <button type="button" aria-label="Open chat history" onClick={() => setDrawerOpen(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"><MenuIcon className="h-5 w-5" /></button>
          {schemeOpen ? <h1 className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">Scheme Generator</h1> : <button type="button" title="Click to rename chat" onClick={() => chat.activeChat && onRenameChat(chat.activeChat.id, chat.activeChat.title)} className="min-w-0 flex-1 truncate text-left text-sm font-bold text-slate-900 hover:text-primary">{activeChatTitle}<PencilIcon className="ml-1 inline h-3 w-3 text-slate-400" /></button>}
          {!schemeOpen ? <>
            <label className="sr-only" htmlFor="ai-model">AI model</label>
            <select id="ai-model" value={chat.model} onChange={(event) => chat.setModel(event.target.value)} className="max-w-[135px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 sm:max-w-[180px]">
              {[...new Set([...models, chat.model])].map((model) => <option key={model} value={model}>{model}</option>)}
            </select>
            <button type="button" aria-label="Share chat" disabled={!chat.activeChat?.messages.length} onClick={() => { setShareError(''); setShareCopied(false); setShareOpen(true) }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 sm:w-auto sm:px-3"><ShareIcon className="h-4 w-4" /><span className="ml-1 hidden text-xs font-semibold sm:inline">Share</span></button>
          </> : <button type="button" onClick={() => setSchemeOpen(false)} className="rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-100">Back to chat</button>}
        </header>
        {modelsError ? <p role="status" className="border-b border-amber-100 bg-amber-50 px-4 py-1 text-center text-[10px] text-amber-800">{modelsError}</p> : null}
        {schemeOpen ? <div className="flex-1 overflow-auto p-4 sm:p-8"><form onSubmit={submitScheme} className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div><h2 className="text-lg font-bold text-slate-900">Generate a scheme of work</h2><p className="mt-1 text-sm text-slate-500">Provide the basics to prepare a curriculum-aligned draft.</p></div>
          <label className="block text-sm font-medium text-slate-700">Subject<input required className="input mt-1" placeholder="e.g. Mathematics" /></label>
          <label className="block text-sm font-medium text-slate-700">Grade<input required className="input mt-1" placeholder="e.g. Grade 5" /></label>
          <label className="block text-sm font-medium text-slate-700">Term<input required className="input mt-1" placeholder="e.g. Term 1" /></label>
          <label className="block text-sm font-medium text-slate-700">Number of weeks<input required type="number" min="1" max="20" className="input mt-1" placeholder="10" /></label>
          <label className="block text-sm font-medium text-slate-700">Syllabus notes<textarea rows={4} className="input mt-1" placeholder="Topics, learning objectives, or curriculum notes" /></label>
          <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"><SparklesIcon className="h-4 w-4" />Generate</button>
          {schemeMessage ? <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{schemeMessage}</p> : null}
        </form></div> : <ChatPanel context={pageName} />}
      </section>

      {projectModal ? <Modal title="Create a project" onClose={() => setProjectModal(false)}><form onSubmit={createProject} className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Project name<input autoFocus required value={projectName} onChange={(event) => setProjectName(event.target.value)} className="input mt-1" /></label>
        <label className="block text-sm font-medium text-slate-700">Description<input value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} className="input mt-1" /></label>
        <label className="block text-sm font-medium text-slate-700">Instructions<textarea rows={4} value={projectInstructions} onChange={(event) => setProjectInstructions(event.target.value)} className="input mt-1" placeholder="Instructions to use in chats in this project" /></label>
        <button className="min-h-11 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Create project</button>
      </form></Modal> : null}
      {settingsOpen ? <Modal title="Customize Intelli AI" onClose={() => setSettingsOpen(false)}><div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Assistant tone<select value={chat.settings.tone} onChange={(event) => chat.setSettings({ ...chat.settings, tone: event.target.value })} className="input mt-1">{AI_TONES.map((tone) => <option key={tone}>{tone}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-700">My subject<input value={chat.settings.subject} onChange={(event) => chat.setSettings({ ...chat.settings, subject: event.target.value })} className="input mt-1" placeholder="e.g. Mathematics" /></label>
        <label className="block text-sm font-medium text-slate-700">My grade<input value={chat.settings.grade} onChange={(event) => chat.setSettings({ ...chat.settings, grade: event.target.value })} className="input mt-1" placeholder="e.g. Grade 5" /></label>
        <label className="block text-sm font-medium text-slate-700">Default language<input value={chat.settings.language} onChange={(event) => chat.setSettings({ ...chat.settings, language: event.target.value })} className="input mt-1" /></label>
        <label className="block text-sm font-medium text-slate-700">Custom instructions<textarea rows={4} value={chat.settings.instructions} onChange={(event) => chat.setSettings({ ...chat.settings, instructions: event.target.value })} className="input mt-1" /></label>
        <button type="button" onClick={() => setSettingsOpen(false)} className="min-h-11 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Done</button>
      </div></Modal> : null}
      {upgradeOpen ? <Modal title="Upgrade to Intelli AI Pro" onClose={() => setUpgradeOpen(false)}><div className="space-y-4">
        <p className="text-sm text-slate-600">Unlock Scheme Generator and more tools for your teaching workflow.</p>
        <ul className="space-y-2 text-sm text-slate-700"><li>✓ Generate structured schemes of work</li><li>✓ Access advanced teaching tools</li><li>✓ More room for your school projects</li></ul>
        <p className="rounded-xl bg-gold/10 p-3 text-sm font-semibold text-gold-700">Pricing will be shown at checkout.</p>
        {checkoutError ? <p role="alert" className="text-sm text-red-700">{checkoutError}</p> : null}
        <button type="button" disabled={checkoutLoading} onClick={() => void doCheckout()} className="min-h-11 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{checkoutLoading ? 'Opening secure checkout…' : 'Upgrade now'}</button>
      </div></Modal> : null}
      {shareOpen ? <Modal title="Share this chat" onClose={() => setShareOpen(false)}><div className="space-y-4">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">Shared chats are read-only and can be seen by anyone with the link. Only create a link if you’re comfortable sharing this conversation.</p>
        {shareError ? <p role="alert" className="text-sm text-red-700">{shareError}</p> : null}
        {!chat.activeChat?.shareUrl ? <button type="button" disabled={shareLoading} onClick={() => void doShare()} className="min-h-11 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{shareLoading ? 'Creating link…' : 'Create share link'}</button> : <>
          <div className="flex gap-2"><input readOnly value={chat.activeChat.shareUrl} aria-label="Read-only share link" className="input min-w-0" /><button type="button" onClick={() => void copyShareLink()} className="shrink-0 rounded-xl border border-slate-200 px-3 text-xs font-semibold">{shareCopied ? 'Copied' : 'Copy link'}</button></div>
          <div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => { if (navigator.share) void navigator.share({ title: chat.activeChat?.title, url: chat.activeChat?.shareUrl }).catch(() => undefined); else setShareError('Web Share is not available on this device.') }} className="rounded-lg border border-slate-200 p-2 text-xs font-semibold">Share…</button><a href={`https://wa.me/?text=${encodeURIComponent(chat.activeChat.shareUrl)}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 p-2 text-center text-xs font-semibold">WhatsApp</a><a href={`mailto:?subject=${encodeURIComponent(chat.activeChat.title)}&body=${encodeURIComponent(chat.activeChat.shareUrl)}`} className="rounded-lg border border-slate-200 p-2 text-center text-xs font-semibold">Email</a></div>
          <button type="button" onClick={() => void disableSharing()} className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Stop sharing</button>
        </>}
      </div></Modal> : null}
    </div>
  )
}

function ChatHistoryItem({ item, active, onSelect, onPin, onRename, onDelete }: {
  item: { id: string; title: string; updatedAt: string; pinned?: boolean }
  active: boolean
  onSelect: () => void
  onPin: () => void
  onRename: () => void
  onDelete: () => void
}) {
  return <div className={`group mb-0.5 flex items-center rounded-lg ${active ? 'bg-primary-50 text-primary' : 'text-slate-700 hover:bg-white'}`}>
    <button type="button" onClick={onSelect} className="min-w-0 flex-1 px-2.5 py-2 text-left"><span className="block truncate text-xs font-medium">{item.title}</span><span className="text-[9px] text-slate-400">{formatDate(item.updatedAt)}</span></button>
    <div className="flex items-center pr-1">
      <button type="button" aria-label={item.pinned ? 'Unpin chat' : 'Pin chat'} onClick={onPin} className="rounded p-1 text-slate-400 hover:text-gold-700"><PinIcon className="h-3.5 w-3.5" /></button>
      <button type="button" aria-label={`Rename ${item.title}`} onClick={onRename} className="rounded p-1 text-slate-400 hover:text-primary"><PencilIcon className="h-3.5 w-3.5" /></button>
      <button type="button" aria-label={`Delete ${item.title}`} onClick={onDelete} className="rounded p-1 text-slate-400 hover:text-red-600"><TrashIcon className="h-3.5 w-3.5" /></button>
    </div>
  </div>
}
