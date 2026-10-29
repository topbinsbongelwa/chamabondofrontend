import { api, ApiError } from '../lib/api'
import { getToken } from '../lib/auth'
import { AI_MOCK_ENABLED, AI_PROVIDER_MODEL } from './constants'
import type { AiChat, AiMessage, AiPlugin, AiProject, AiSettings } from './types'

const API_ROOT = '/api/ai'
const AI_ASK_ENDPOINT = '/api/ai/ask'
const storageKey = 'chamabondo_ai_chats'
let mockChats: AiChat[] = []

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readChats(): AiChat[] {
  if (AI_MOCK_ENABLED && mockChats.length) return mockChats
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) return JSON.parse(stored) as AiChat[]
  } catch {
    // Keep the assistant usable when browser storage is unavailable.
  }
  return []
}

function saveChats(chats: AiChat[]): void {
  mockChats = chats
  try {
    localStorage.setItem(storageKey, JSON.stringify(chats))
  } catch {
    // In-memory history remains available for this page session.
  }
}

export async function fetchChats(): Promise<AiChat[]> {
  return readChats()
}

export function getCachedChats(): AiChat[] {
  return readChats()
}

export async function fetchModels(): Promise<string[]> {
  if (AI_MOCK_ENABLED) return ['Auto', AI_PROVIDER_MODEL]
  return [AI_PROVIDER_MODEL]
}

export async function fetchPlugins(): Promise<AiPlugin[]> {
  if (AI_MOCK_ENABLED) {
    return [
      { id: 'lesson-planner', name: 'Lesson planner', description: 'Structure engaging lessons for your class.' },
      { id: 'school-calendar', name: 'School calendar', description: 'Help with school dates and activities.' },
      { id: 'web-search', name: 'Web search', description: 'Find current educational information.' },
    ]
  }
  const payload = await api<AiPlugin[] | { plugins?: AiPlugin[] }>(`${API_ROOT}/plugins`)
  return Array.isArray(payload) ? payload : payload.plugins ?? []
}

export async function createShareLink(chatId: string): Promise<string> {
  if (AI_MOCK_ENABLED) return `${window.location.origin}/shared/${encodeURIComponent(chatId)}`
  const payload = await api<{ url?: string; shareUrl?: string }>(`${API_ROOT}/chats/${encodeURIComponent(chatId)}/share`, {
    method: 'POST',
    body: { readOnly: true },
  })
  const url = payload.url ?? payload.shareUrl
  if (!url) throw new ApiError('The server did not return a share link.')
  return url
}

export async function stopSharing(chatId: string): Promise<void> {
  if (AI_MOCK_ENABLED) return
  await api<void>(`${API_ROOT}/chats/${encodeURIComponent(chatId)}/share`, { method: 'DELETE' })
}

export async function startCheckout(): Promise<string> {
  if (AI_MOCK_ENABLED) return `${window.location.origin}/account?upgrade=demo`
  const payload = await api<{ url?: string; checkoutUrl?: string }>(`${API_ROOT}/upgrade/checkout`, { method: 'POST' })
  const url = payload.url ?? payload.checkoutUrl
  if (!url) throw new ApiError('The server did not return a checkout URL.')
  return url
}

export async function uploadAiFile(
  file: File,
  onProgress: (progress: number) => void,
): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new ApiError('Files must be 10 MB or smaller.')
  if (AI_MOCK_ENABLED) {
    onProgress(100)
    return file.name
  }
  const formData = new FormData()
  formData.append('file', file)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const baseUrl = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')
    xhr.open('POST', `${baseUrl || 'http://localhost:5000'}${API_ROOT}/files`)
    xhr.setRequestHeader('Accept', 'application/json')
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onerror = () => reject(new ApiError('Could not upload the file. Check your connection.'))
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(`The upload failed (${xhr.status}).`, xhr.status))
        return
      }
      try {
        const result = JSON.parse(xhr.responseText) as { fileId?: string; id?: string; name?: string }
        resolve(result.fileId ?? result.id ?? result.name ?? file.name)
      } catch {
        reject(new ApiError('The server returned an invalid upload response.'))
      }
    }
    xhr.send(formData)
  })
}

export interface ChatRequest {
  chatId: string
  message: string
  history: AiMessage[]
  context: string
  model: string
  settings: AiSettings
  webSearch: boolean
  plugins: string[]
  files: string[]
}

export async function streamAiReply(
  request: ChatRequest,
  onEvent: (event: { type: 'status' | 'token'; text: string }) => void,
  signal: AbortSignal,
): Promise<{ chatId: string }> {
  if (AI_MOCK_ENABLED) {
    onEvent({ type: 'status', text: 'Thinking...' })
    const reply = `Here’s a helpful starting point for **${request.message}**.\n\nI can help you shape this into practical classroom-ready materials. Tell me the grade, subject, and any school requirements you would like me to consider.\n\n- Keep the learning goal clear\n- Include an activity learners can complete\n- Finish with a quick check for understanding`
    for (const token of reply.split(/(\s+)/)) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
      await new Promise((resolve) => setTimeout(resolve, 30))
      onEvent({ type: 'token', text: token })
    }
    return { chatId: request.chatId }
  }
  onEvent({ type: 'status', text: 'Consulting Intelli AI...' })
  const history = request.history.slice()
  if (history.at(-1)?.role === 'user' && history.at(-1)?.content === request.message) {
    history.pop()
  }
  const context = [
    request.context,
    request.settings.subject && `Subject: ${request.settings.subject}`,
    request.settings.grade && `Grade: ${request.settings.grade}`,
    request.settings.language && `Language: ${request.settings.language}`,
    request.settings.tone && `Tone: ${request.settings.tone}`,
    request.settings.instructions,
  ].filter(Boolean).join('\n')
  const response = await fetch(AI_ASK_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: JSON.stringify({
      question: request.message,
      context,
      history: history.map((message) => ({
        role: message.role,
        text: message.content,
      })),
    }),
    signal,
  })
  if (!response.ok) {
    let message = `The request failed (${response.status}).`
    try {
      const payload = await response.json() as { message?: string; error?: string }
      message = payload.message ?? payload.error ?? message
    } catch {
      // The HTTP status remains an actionable error when the body is not JSON.
    }
    throw new ApiError(message, response.status)
  }
  if (response.headers.get('content-type')?.includes('application/json')) {
    let payload: { answer?: unknown; error?: unknown }
    try {
      payload = await response.json() as { answer?: unknown; error?: unknown }
    } catch {
      throw new ApiError('Intelli AI returned an invalid response.')
    }
    if (typeof payload.answer !== 'string' || !payload.answer.trim()) {
      const message = typeof payload.error === 'string' ? payload.error : 'Intelli AI returned no answer.'
      throw new ApiError(message)
    }
    onEvent({ type: 'token', text: payload.answer })
    return { chatId: request.chatId }
  }
  if (!response.body) throw new ApiError('The AI service returned an empty stream.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let responseChatId = request.chatId
  const consumeLine = (line: string) => {
    if (!line.startsWith('data:')) return
    const text = line.slice(5).trim()
    if (!text || text === '[DONE]') return
    try {
      const event = JSON.parse(text) as { type?: string; text?: string; token?: string; chatId?: string; message?: string }
      if (event.chatId) responseChatId = event.chatId
      if (event.type === 'status' && event.text) onEvent({ type: 'status', text: event.text })
      else if ((event.type === 'token' || event.token) && (event.text ?? event.token)) {
        onEvent({ type: 'token', text: event.text ?? event.token ?? '' })
      } else if (event.type === 'error') {
        throw new ApiError(event.message ?? 'The AI response could not be completed.')
      }
    } catch (error) {
      if (error instanceof ApiError) throw error
      onEvent({ type: 'token', text })
    }
  }
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      pending += decoder.decode(value, { stream: true })
      const lines = pending.split(/\r?\n/)
      pending = lines.pop() ?? ''
      lines.forEach(consumeLine)
    }
    if (pending.trim()) consumeLine(pending)
  } finally {
    reader.releaseLock()
  }
  return { chatId: responseChatId }
}

export function persistChats(chats: AiChat[]): void {
  saveChats(chats)
}

export function newChat(): AiChat {
  return { id: newId(), title: 'New chat', updatedAt: new Date().toISOString(), messages: [] }
}

export function newMessage(role: AiMessage['role'], content: string, files?: string[]): AiMessage {
  return { id: newId(), role, content, createdAt: new Date().toISOString(), ...(files?.length ? { files } : {}) }
}

export function newProjectId(): string {
  return newId()
}

export function persistProjects(projects: AiProject[]): void {
  try {
    localStorage.setItem('chamabondo_ai_projects', JSON.stringify(projects))
  } catch {
    // Projects remain in memory until the page is closed.
  }
}

export function readProjects(): AiProject[] {
  try {
    return JSON.parse(localStorage.getItem('chamabondo_ai_projects') ?? '[]') as AiProject[]
  } catch {
    return []
  }
}
