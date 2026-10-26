export interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  rating?: 'up' | 'down'
  files?: string[]
}

export interface AiChat {
  id: string
  title: string
  updatedAt: string
  messages: AiMessage[]
  pinned?: boolean
  projectId?: string
  shareUrl?: string
}

export interface AiProject {
  id: string
  name: string
  description: string
  instructions: string
}

export interface AiSettings {
  tone: string
  subject: string
  grade: string
  language: string
  instructions: string
}

export interface AiPlugin {
  id: string
  name: string
  description: string
}

export interface AiStreamEvent {
  type: 'token' | 'status' | 'done' | 'error'
  text?: string
  message?: string
  chatId?: string
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  tone: 'Friendly',
  subject: '',
  grade: '',
  language: 'English',
  instructions: '',
}
