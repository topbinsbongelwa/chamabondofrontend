import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPlugins, uploadAiFile } from '../../ai/api'
import { AI_SUGGESTIONS, AI_UPLOAD_ACCEPT, AI_UPLOAD_LIMIT } from '../../ai/constants'
import type { AiPlugin } from '../../ai/types'
import { useChat } from '../../hooks/useChat'
import { useSpeech } from '../../hooks/useSpeech'
import { getDisplayName } from '../../lib/auth'
import {
  CloseIcon,
  CopyIcon,
  MicIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
  SpinnerIcon,
  StopIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from '../icons'

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\$[^$]+\$)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.92em]">{part.slice(1, -1)}</code>
    if (part.startsWith('$') && part.endsWith('$')) return <span key={index} role="math" className="font-serif italic tracking-wide">{part.slice(1, -1)}</span>
    return part
  })
}

function MarkdownText({ content, compact }: { content: string; compact: boolean }) {
  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []
  const tableStarts = new Map<number, string[][]>()
  const tableContinuation = new Set<number>()
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\s*\|.*\|\s*$/.test(lines[index])) continue
    const rows: string[][] = []
    let end = index
    while (end < lines.length && /^\s*\|.*\|\s*$/.test(lines[end])) {
      const row = lines[end].trim().split('|').slice(1, -1).map((cell) => cell.trim())
      if (!/^[\s:|-]+$/.test(row.join(''))) rows.push(row)
      if (end > index) tableContinuation.add(end)
      end += 1
    }
    tableStarts.set(index, rows)
    index = end - 1
  }
  let list: string[] = []
  let code: string[] = []
  let inCode = false
  let codeLanguage = ''
  const flushList = () => {
    if (list.length) {
      nodes.push(<ul key={`list-${nodes.length}`} className="my-2 list-disc space-y-1 pl-5">{list.map((item, index) => <li key={index}>{renderInline(item)}</li>)}</ul>)
      list = []
    }
  }
  const flushCode = () => {
    if (code.length) {
      const source = code.join('\n')
      nodes.push(
        <div key={`code-${nodes.length}`} className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-slate-100">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[11px] text-slate-400">
            <span>{codeLanguage || 'Code'}</span>
            <button type="button" aria-label="Copy code" className="inline-flex items-center gap-1 hover:text-white" onClick={() => void navigator.clipboard?.writeText(source)}><CopyIcon className="h-3.5 w-3.5" /> Copy</button>
          </div>
          <pre className="overflow-x-auto p-3 text-xs leading-relaxed"><code>{source}</code></pre>
        </div>,
      )
      code = []
    }
  }
  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      flushList()
      if (inCode) {
        inCode = false
        flushCode()
      } else {
        inCode = true
        codeLanguage = line.slice(3).trim()
      }
      return
    }
    if (inCode) {
      code.push(line)
      return
    }
    if (tableContinuation.has(index)) return
    const tableRows = tableStarts.get(index)
    if (tableRows?.length) {
      flushList()
      const header = tableRows[0]
      nodes.push(
        <div key={`table-${index}`} className="my-2 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead><tr>{header.map((cell, cellIndex) => <th key={cellIndex} className="border border-slate-200 bg-slate-100 px-2 py-1.5 font-semibold text-slate-800">{renderInline(cell)}</th>)}</tr></thead>
            <tbody>{tableRows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border border-slate-200 px-2 py-1.5">{renderInline(cell)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      )
      return
    }
    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ''))
      return
    }
    flushList()
    if (!line.trim()) return
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      nodes.push(<h3 key={`heading-${index}`} className="mb-1 mt-3 font-bold text-slate-900">{renderInline(heading[2])}</h3>)
      return
    }
    nodes.push(<p key={`p-${index}`} className={`my-1.5 whitespace-pre-wrap leading-relaxed ${compact ? 'text-[13px]' : ''}`}>{renderInline(line.replace(/\$([^$]+)\$/g, '$1'))}</p>)
  })
  flushList()
  flushCode()
  return <div className="min-w-0">{nodes}</div>
}

function ThinkingPill({ status }: { status: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-100 to-blue-100 px-3 py-1.5 text-xs font-medium text-indigo-800 shadow-sm">
      <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
      <span className="animate-pulse">{status}</span>
    </div>
  )
}

interface ChatPanelProps {
  compact?: boolean
  context?: string
}

export function ChatPanel({ compact = false, context = '' }: ChatPanelProps) {
  const chat = useChat()
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [plugins, setPlugins] = useState<AiPlugin[]>([])
  const [pluginError, setPluginError] = useState('')
  const [attached, setAttached] = useState<Array<{ id: string; name: string; progress: number }>>([])
  const [voice, setVoice] = useState(() => localStorage.getItem('chamabondo_ai_voice') ?? '')
  const [voiceRate, setVoiceRate] = useState(() => Number(localStorage.getItem('chamabondo_ai_voice_rate') ?? '1'))
  const [voiceLanguage, setVoiceLanguage] = useState(() => localStorage.getItem('chamabondo_ai_voice_language') ?? 'en')
  const [autoRead, setAutoRead] = useState(() => localStorage.getItem('chamabondo_ai_auto_read') === 'true')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const speechBaseRef = useRef('')
  const transcriptCallback = useCallback((text: string) => setDraft(`${speechBaseRef.current}${speechBaseRef.current ? ' ' : ''}${text}`), [])
  const speech = useSpeech(transcriptCallback)
  const assistantMessages = chat.activeChat?.messages.filter((message) => message.role === 'assistant') ?? []

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chat.activeChat?.messages, chat.generating])

  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return
    const updateVoices = () => setVoices(speechSynthesis.getVoices())
    updateVoices()
    speechSynthesis.addEventListener('voiceschanged', updateVoices)
    return () => speechSynthesis.removeEventListener('voiceschanged', updateVoices)
  }, [])

  useEffect(() => {
    if (!autoRead) return
    const latest = assistantMessages[assistantMessages.length - 1]
    if (latest?.content) speak(latest.content)
  // Automatic reading only follows newly completed answers.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRead, assistantMessages.length, chat.generating])

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const selectedVoice = voices.find((item) => item.name === voice)
    if (selectedVoice) utterance.voice = selectedVoice
    utterance.rate = voiceRate
    utterance.lang = voiceLanguage
    speechSynthesis.speak(utterance)
  }

  const submit = (message = draft) => {
    if (!message.trim() || chat.generating || !chat.online) return
    const uploadedFiles = attached.map((file) => file.id)
    void chat.sendMessage(message, context, uploadedFiles)
    setDraft('')
    setAttached([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleFileSelection = async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      if (file.size > AI_UPLOAD_LIMIT) {
        chat.updateChat(chat.activeChatId, { title: chat.activeChat?.title ?? 'New chat' })
        window.alert(`${file.name} is larger than the 10 MB limit.`)
        continue
      }
      const localId = `${Date.now()}-${file.name}`
      setAttached((current) => [...current, { id: localId, name: file.name, progress: 0 }])
      try {
        const uploadedId = await uploadAiFile(file, (progress) => {
          setAttached((current) => current.map((item) => item.id === localId ? { ...item, progress } : item))
        })
        setAttached((current) => current.map((item) => item.id === localId ? { ...item, id: uploadedId, progress: 100 } : item))
      } catch (error) {
        setAttached((current) => current.filter((item) => item.id !== localId))
        window.alert(error instanceof Error ? error.message : 'The file could not be uploaded.')
      }
    }
  }

  const togglePlugin = (id: string) => {
    chat.setEnabledPlugins(chat.enabledPlugins.includes(id)
      ? chat.enabledPlugins.filter((plugin) => plugin !== id)
      : [...chat.enabledPlugins, id])
  }

  const openPlugins = async () => {
    setMenuOpen((current) => !current)
    if (plugins.length) return
    setPluginError('')
    try {
      setPlugins(await fetchPlugins())
    } catch (error) {
      setPluginError(error instanceof Error ? error.message : 'Could not load available tools.')
    }
  }

  const keyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {!chat.online ? <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900">You’re offline. Chat history is available, but sending is paused.</div> : null}
      {chat.error ? (
        <div role="alert" className="mx-4 mt-3 flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          <span>{chat.error}</span>
          {chat.errorStatus === 402
            ? <button type="button" onClick={() => navigate('/ai-assistant?upgrade=1')} className="shrink-0 font-bold underline">View upgrade options</button>
            : <button type="button" onClick={chat.retry} className="shrink-0 font-bold underline">Retry</button>}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7">
        {!chat.activeChat?.messages.length ? (
          <div className={`mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center text-center ${compact ? 'py-4' : 'py-8'}`}>
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-gold/20 text-primary"><SparklesIcon className="h-7 w-7" /></span>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">{compact ? `Hi ${getDisplayName().split(' ')[0]}!` : `Good day, ${getDisplayName().split(' ')[0]}`}</h2>
            <p className="mt-1 text-sm text-slate-500">What can I help you with today?</p>
            <div className={`mt-5 grid w-full gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
              {AI_SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => submit(suggestion)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:border-primary/40 hover:bg-primary-50">{suggestion}</button>)}
            </div>
            {!compact ? <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Don’t enter learners’ names or personal details.</p> : null}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {chat.activeChat?.messages.map((message) => {
              const isUser = message.role === 'user'
              return (
                <div key={message.id} className={`group flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser ? <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary"><SparklesIcon className="h-4 w-4" /></span> : null}
                  <div className={`min-w-0 max-w-[88%] rounded-2xl px-3.5 py-2.5 sm:max-w-[82%] ${isUser ? 'rounded-tr-md bg-primary text-white' : 'rounded-tl-md border border-slate-100 bg-slate-50 text-slate-700'}`}>
                    {isUser ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p> : message.content
                      ? <MarkdownText content={message.content} compact={compact} />
                      : chat.generating ? <ThinkingPill status={chat.status} /> : null}
                    {message.files?.length ? <p className="mt-1 text-[10px] opacity-75">Attachments: {message.files.join(', ')}</p> : null}
                    {!isUser && message.content ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-slate-200/70 pt-1.5 opacity-100 sm:opacity-0 sm:transition group-hover:opacity-100 group-focus-within:opacity-100">
                        <button type="button" aria-label="Copy message" onClick={() => void navigator.clipboard?.writeText(message.content)} className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"><CopyIcon className="h-3.5 w-3.5" /></button>
                        <button type="button" aria-label="Read answer aloud" onClick={() => speak(message.content)} className="rounded px-1.5 py-1 text-[10px] text-slate-400 hover:bg-white hover:text-slate-700">Read aloud</button>
                        <button type="button" aria-label="Regenerate answer" onClick={() => {
                          const messageIndex = chat.activeChat?.messages.findIndex((item) => item.id === message.id) ?? -1
                          const prompt = messageIndex < 0 ? undefined : chat.activeChat?.messages.slice(0, messageIndex).reverse().find((item) => item.role === 'user')
                          if (prompt) void chat.sendMessage(prompt.content, context, undefined, 'regenerate', prompt.id)
                        }} className="rounded px-1.5 py-1 text-[10px] text-slate-400 hover:bg-white hover:text-slate-700">Regenerate</button>
                        <button type="button" aria-label="Helpful" aria-pressed={message.rating === 'up'} onClick={() => chat.updateMessage(chat.activeChatId, message.id, { rating: message.rating === 'up' ? undefined : 'up' })} className={`rounded p-1 ${message.rating === 'up' ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}><ThumbsUpIcon className="h-3.5 w-3.5" /></button>
                        <button type="button" aria-label="Not helpful" aria-pressed={message.rating === 'down'} onClick={() => chat.updateMessage(chat.activeChatId, message.id, { rating: message.rating === 'down' ? undefined : 'down' })} className={`rounded p-1 ${message.rating === 'down' ? 'text-red-600' : 'text-slate-400 hover:text-red-600'}`}><ThumbsDownIcon className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
            <div ref={messageEndRef} />
          </div>
        )}
      </div>

      <div className="relative border-t border-slate-100 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
        {chat.generating ? <div className="mb-2 flex justify-center"><button type="button" onClick={chat.stop} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"><StopIcon className="h-3.5 w-3.5" /> Stop generating</button></div> : null}
        {(attached.length > 0 || chat.webSearch || chat.enabledPlugins.length > 0) ? (
          <div className="mx-auto mb-2 flex max-w-3xl flex-wrap gap-1.5">
            {attached.map((file) => <span key={file.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-700">{file.name}{file.progress < 100 ? ` ${file.progress}%` : ''}<button type="button" aria-label={`Remove ${file.name}`} onClick={() => setAttached((current) => current.filter((item) => item.id !== file.id))}><CloseIcon className="h-3 w-3" /></button></span>)}
            {chat.webSearch ? <button type="button" onClick={() => chat.setWebSearch(false)} className="rounded-full bg-blue-50 px-2 py-1 text-[10px] text-blue-800">Web search ×</button> : null}
            {chat.enabledPlugins.map((id) => <button type="button" key={id} onClick={() => togglePlugin(id)} className="rounded-full bg-primary-50 px-2 py-1 text-[10px] text-primary">{plugins.find((plugin) => plugin.id === id)?.name ?? id} ×</button>)}
          </div>
        ) : null}
        <div className="relative mx-auto max-w-3xl rounded-2xl border border-slate-300 bg-white shadow-sm focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
          <label htmlFor={compact ? 'ai-compact-composer' : 'ai-composer'} className="sr-only">Message Intelli AI</label>
          <textarea
            id={compact ? 'ai-compact-composer' : 'ai-composer'}
            ref={textareaRef}
            rows={1}
            value={draft}
            disabled={!chat.online || chat.generating}
            onChange={(event) => {
              setDraft(event.target.value)
              event.target.style.height = 'auto'
              event.target.style.height = `${Math.min(event.target.scrollHeight, 180)}px`
            }}
            onKeyDown={keyDown}
            placeholder={chat.online ? 'Ask Intelli AI anything...' : 'You are offline'}
            className="max-h-[180px] min-h-[46px] w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Open attachments and tools" aria-expanded={menuOpen} onClick={() => void openPlugins()} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><PlusIcon className="h-5 w-5" /></button>
              <button type="button" aria-label={speech.recording ? 'Stop voice input' : 'Start voice input'} onClick={() => { if (!speech.recording) speechBaseRef.current = draft.trim(); speech.toggleRecording(voiceLanguage) }} className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 ${speech.recording ? 'animate-pulse bg-red-50 text-red-600' : ''}`}><MicIcon className="h-4 w-4" /></button>
              <button type="button" aria-label="Voice settings" aria-expanded={voiceOpen} onClick={() => setVoiceOpen((open) => !open)} className="rounded-lg px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-100">Voice</button>
              {!speech.supported ? <span className="max-w-[120px] text-[9px] leading-tight text-slate-400 sm:max-w-none sm:text-[10px]">Voice input unavailable in this browser</span> : speech.recording ? <span className="text-[10px] font-semibold text-red-600">Listening…</span> : null}
            </div>
            <button type="button" aria-label={chat.generating ? 'Stop generating' : 'Send message'} disabled={!chat.generating && (!draft.trim() || !chat.online)} onClick={() => chat.generating ? chat.stop() : submit()} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40">
              {chat.generating ? <StopIcon className="h-4 w-4" /> : <SendIcon className="h-4 w-4" />}
            </button>
          </div>
          <input ref={fileRef} type="file" multiple accept={AI_UPLOAD_ACCEPT} className="hidden" onChange={(event) => { void handleFileSelection(event.target.files); event.target.value = '' }} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { void handleFileSelection(event.target.files); event.target.value = '' }} />
          {menuOpen ? (
            <div className="absolute bottom-full left-2 z-30 mb-2 max-h-[60vh] w-[min(300px,calc(100vw-40px))] overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <button type="button" onClick={() => { chat.setWebSearch(!chat.webSearch); setMenuOpen(false) }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50"><span className="block text-xs font-semibold text-slate-800">Web search {chat.webSearch ? '✓' : ''}</span><span className="text-[10px] text-slate-500">Search the web for up-to-date information.</span></button>
              <button type="button" onClick={() => { fileRef.current?.click(); setMenuOpen(false) }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50"><span className="block text-xs font-semibold text-slate-800">Upload file</span><span className="text-[10px] text-slate-500">PDF, DOCX, or image up to 10 MB.</span></button>
              <button type="button" onClick={() => { cameraRef.current?.click(); setMenuOpen(false) }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50"><span className="block text-xs font-semibold text-slate-800">Upload picture</span><span className="text-[10px] text-slate-500">Choose from gallery or take a photo.</span></button>
              {plugins.map((plugin) => <label key={plugin.id} className="flex cursor-pointer items-start gap-2 rounded-lg px-3 py-2 hover:bg-slate-50"><input type="checkbox" checked={chat.enabledPlugins.includes(plugin.id)} onChange={() => togglePlugin(plugin.id)} className="mt-0.5 accent-primary" /><span><span className="block text-xs font-semibold text-slate-800">{plugin.name}</span><span className="text-[10px] text-slate-500">{plugin.description}</span></span></label>)}
              {pluginError ? <p role="alert" className="px-3 py-2 text-xs text-red-700">{pluginError}</p> : null}
            </div>
          ) : null}
          {voiceOpen ? (
            <div className="absolute bottom-full left-12 z-30 mb-2 w-[min(260px,calc(100vw-48px))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <label className="mb-2 block text-[11px] font-semibold text-slate-700">Read-aloud voice<select value={voice} onChange={(event) => { setVoice(event.target.value); localStorage.setItem('chamabondo_ai_voice', event.target.value) }} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"><option value="">System default</option>{voices.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
              <label className="mb-2 block text-[11px] font-semibold text-slate-700">Language<input value={voiceLanguage} onChange={(event) => { setVoiceLanguage(event.target.value); localStorage.setItem('chamabondo_ai_voice_language', event.target.value) }} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs" /></label>
              <label className="mb-2 block text-[11px] font-semibold text-slate-700">Speed <select value={voiceRate} onChange={(event) => { setVoiceRate(Number(event.target.value)); localStorage.setItem('chamabondo_ai_voice_rate', event.target.value) }} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"><option value={0.75}>Slow</option><option value={1}>Normal</option><option value={1.25}>Fast</option></select></label>
              <label className="flex items-center gap-2 text-[11px] text-slate-700"><input type="checkbox" checked={autoRead} onChange={(event) => { setAutoRead(event.target.checked); localStorage.setItem('chamabondo_ai_auto_read', String(event.target.checked)) }} className="accent-primary" />Read answers aloud automatically</label>
            </div>
          ) : null}
        </div>
        <p className="mx-auto mt-1.5 max-w-3xl text-center text-[10px] text-slate-400">Intelli AI can make mistakes. Check important information.</p>
      </div>
    </div>
  )
}
