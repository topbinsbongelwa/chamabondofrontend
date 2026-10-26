import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import {
  fetchChats,
  getCachedChats,
  newChat,
  newMessage,
  persistChats,
  readProjects,
  streamAiReply,
} from '../ai/api'
import { DEFAULT_AI_SETTINGS } from '../ai/types'
import type { AiChat, AiMessage, AiSettings } from '../ai/types'

interface ChatContextValue {
  chats: AiChat[]
  activeChat: AiChat | null
  activeChatId: string
  loading: boolean
  generating: boolean
  status: string
  error: string
  errorStatus: number
  online: boolean
  model: string
  setModel: (model: string) => void
  settings: AiSettings
  setSettings: (settings: AiSettings) => void
  webSearch: boolean
  setWebSearch: (enabled: boolean) => void
  enabledPlugins: string[]
  setEnabledPlugins: (plugins: string[]) => void
  newConversation: (projectId?: string) => void
  selectChat: (id: string) => void
  sendMessage: (message: string, context?: string, files?: string[], mode?: 'retry' | 'regenerate', targetUserMessageId?: string) => Promise<void>
  stop: () => void
  updateChat: (id: string, update: Partial<AiChat>) => void
  updateMessage: (chatId: string, messageId: string, update: Partial<AiMessage>) => void
  removeChat: (id: string) => void
  retry: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

function readStoredSettings(): AiSettings {
  try {
    return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(localStorage.getItem('chamabondo_ai_settings') ?? '{}') }
  } catch {
    return DEFAULT_AI_SETTINGS
  }
}

function readStringArray(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as string[]
  } catch {
    return []
  }
}

function AssistantChatState({ children }: { children: ReactNode }) {
  const online = useOnlineStatus()
  const [chats, setChats] = useState<AiChat[]>([])
  const [activeChatId, setActiveChatId] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState('Consulting Intelli AI...')
  const [error, setError] = useState('')
  const [errorStatus, setErrorStatus] = useState(0)
  const [lastPrompt, setLastPrompt] = useState<{ prompt: string; context: string; files?: string[] } | null>(null)
  const [model, setModelState] = useState(() => localStorage.getItem('chamabondo_ai_model') ?? 'Auto')
  const [settings, setSettingsState] = useState(readStoredSettings)
  const [webSearch, setWebSearchState] = useState(false)
  const [enabledPlugins, setEnabledPluginsState] = useState<string[]>(() => readStringArray('chamabondo_ai_plugins'))
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchChats()
      .then((loadedChats) => {
        if (cancelled) return
        setChats(loadedChats)
        const savedId = localStorage.getItem('chamabondo_ai_active_chat')
        setActiveChatId(loadedChats.some((chat) => chat.id === savedId) ? savedId ?? '' : loadedChats[0]?.id ?? '')
      })
      .catch((fetchError: unknown) => {
        if (cancelled) return
        const cached = getCachedChats()
        setChats(cached)
        const savedId = localStorage.getItem('chamabondo_ai_active_chat')
        setActiveChatId(cached.some((chat) => chat.id === savedId) ? savedId ?? '' : cached[0]?.id ?? '')
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load chat history.')
        setErrorStatus(typeof fetchError === 'object' && fetchError !== null && 'status' in fetchError
          ? Number((fetchError as { status?: unknown }).status ?? 0)
          : 0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!loading) persistChats(chats)
  }, [chats, loading])

  useEffect(() => {
    if (activeChatId) localStorage.setItem('chamabondo_ai_active_chat', activeChatId)
    else localStorage.removeItem('chamabondo_ai_active_chat')
  }, [activeChatId])

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null

  const setModel = useCallback((nextModel: string) => {
    setModelState(nextModel)
    localStorage.setItem('chamabondo_ai_model', nextModel)
  }, [])

  const setSettings = useCallback((nextSettings: AiSettings) => {
    setSettingsState(nextSettings)
    localStorage.setItem('chamabondo_ai_settings', JSON.stringify(nextSettings))
  }, [])

  const setWebSearch = useCallback((enabled: boolean) => setWebSearchState(enabled), [])

  const setEnabledPlugins = useCallback((plugins: string[]) => {
    setEnabledPluginsState(plugins)
    localStorage.setItem('chamabondo_ai_plugins', JSON.stringify(plugins))
  }, [])

  const updateChat = useCallback((id: string, update: Partial<AiChat>) => {
    setChats((current) => current.map((chat) => chat.id === id ? { ...chat, ...update, updatedAt: new Date().toISOString() } : chat))
  }, [])

  const updateMessage = useCallback((chatId: string, messageId: string, update: Partial<AiMessage>) => {
    setChats((current) => current.map((chat) => chat.id === chatId
      ? { ...chat, messages: chat.messages.map((message) => message.id === messageId ? { ...message, ...update } : message) }
      : chat))
  }, [])

  const newConversation = useCallback((projectId?: string) => {
    const chat = newChat()
    chat.projectId = projectId
    setChats((current) => [chat, ...current])
    setActiveChatId(chat.id)
    setError('')
    setErrorStatus(0)
  }, [])

  const selectChat = useCallback((id: string) => {
    setActiveChatId(id)
    setError('')
  }, [])

  const removeChat = useCallback((id: string) => {
    setChats((current) => {
      const remaining = current.filter((chat) => chat.id !== id)
      if (activeChatId === id) setActiveChatId(remaining[0]?.id ?? '')
      return remaining
    })
  }, [activeChatId])

  const sendMessage = useCallback(async (prompt: string, context = '', files?: string[], mode?: 'retry' | 'regenerate', targetUserMessageId?: string) => {
    if (!online || generating || !prompt.trim()) return
    let chat = chats.find((item) => item.id === activeChatId)
    if (!chat) {
      chat = newChat()
      setActiveChatId(chat.id)
    }
    const targetMessageIndex = mode === 'regenerate'
      ? chat.messages.findIndex((message) => message.id === targetUserMessageId)
      : -1
    const previousUserMessage = targetMessageIndex >= 0 ? chat.messages[targetMessageIndex] : undefined
    const userMessage = mode === 'regenerate' && previousUserMessage
      ? previousUserMessage
      : newMessage('user', prompt.trim(), files)
    const assistantMessage = newMessage('assistant', '')
    const priorMessages = mode === 'regenerate' && targetMessageIndex >= 0
      ? chat.messages.slice(0, targetMessageIndex)
      : mode === 'retry' && chat.messages.at(-1)?.role === 'user'
        ? chat.messages.slice(0, -1)
        : chat.messages
    const previousHistory = priorMessages
    const title = chat.title === 'New chat' ? prompt.trim().slice(0, 48) : chat.title
    chat = {
      ...chat,
      title,
      updatedAt: new Date().toISOString(),
      messages: [...previousHistory, userMessage, assistantMessage],
    }
    setChats((current) => [chat as AiChat, ...current.filter((item) => item.id !== chat?.id)])
    setLastPrompt({ prompt: prompt.trim(), context, files })
    setError('')
    setErrorStatus(0)
    setGenerating(true)
    setStatus('Consulting Intelli AI...')
    const controller = new AbortController()
    abortRef.current = controller
    let gotFirstToken = false
    const statusCycle = window.setInterval(() => {
      if (!gotFirstToken) setStatus((current) => current === 'Consulting Intelli AI...' ? 'Thinking...' : current === 'Thinking...' ? 'Writing your answer...' : 'Thinking...')
    }, 1800)
    const projectInstructions = chat.projectId
      ? readProjects().find((project) => project.id === chat.projectId)?.instructions
      : undefined
    const effectiveSettings = projectInstructions
      ? { ...settings, instructions: [settings.instructions, projectInstructions].filter(Boolean).join('\n') }
      : settings
    try {
      const result = await streamAiReply({
        chatId: chat.id,
        message: prompt.trim(),
        history: [...previousHistory, userMessage],
        context,
        model,
        settings: effectiveSettings,
        webSearch,
        plugins: enabledPlugins,
        files: files ?? [],
      }, (event) => {
        if (event.type === 'status') setStatus(event.text)
        else {
          gotFirstToken = true
          setChats((current) => current.map((item) => item.id === chat?.id
            ? {
              ...item,
              messages: item.messages.map((message) => message.id === assistantMessage.id
                ? { ...message, content: message.content + event.text }
                : message),
            }
            : item))
        }
      }, controller.signal)
      if (result.chatId !== chat.id) {
        setChats((current) => current.map((item) => item.id === chat?.id ? { ...item, id: result.chatId } : item))
        setActiveChatId((current) => current === chat?.id ? result.chatId : current)
      }
    } catch (sendError) {
      if ((sendError as { name?: string }).name === 'AbortError') {
        setChats((current) => current.map((item) => item.id === chat?.id
          ? {
            ...item,
            messages: item.messages.map((message) => message.id === assistantMessage.id && !message.content
              ? { ...message, content: 'Generation stopped.' }
              : message),
          }
          : item))
      } else {
        const reason = sendError instanceof Error ? sendError.message : 'Your message could not be sent.'
        setError(reason)
        setErrorStatus(typeof sendError === 'object' && sendError !== null && 'status' in sendError
          ? Number((sendError as { status?: unknown }).status ?? 0)
          : 0)
        setChats((current) => current.map((item) => item.id === chat?.id
          ? { ...item, messages: item.messages.filter((message) => message.id !== assistantMessage.id) }
          : item))
      }
    } finally {
      window.clearInterval(statusCycle)
      abortRef.current = null
      setGenerating(false)
    }
  }, [activeChatId, chats, enabledPlugins, generating, model, online, settings, webSearch])

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const retry = useCallback(() => {
    if (lastPrompt) void sendMessage(lastPrompt.prompt, lastPrompt.context, lastPrompt.files, 'retry')
  }, [lastPrompt, sendMessage])

  const value = useMemo<ChatContextValue>(() => ({
    chats, activeChat, activeChatId, loading, generating, status, error, errorStatus, online, model, setModel,
    settings, setSettings, webSearch, setWebSearch, enabledPlugins, setEnabledPlugins,
    newConversation, selectChat, sendMessage, stop, updateChat, updateMessage, removeChat, retry,
  }), [chats, activeChat, activeChatId, loading, generating, status, error, errorStatus, online, model, setModel,
    settings, setSettings, webSearch, setWebSearch, enabledPlugins, setEnabledPlugins,
    newConversation, selectChat, sendMessage, stop, updateChat, updateMessage, removeChat, retry])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function AiChatProvider({ children }: { children: ReactNode }) {
  return <AssistantChatState>{children}</AssistantChatState>
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat must be used inside AiChatProvider.')
  return context
}
