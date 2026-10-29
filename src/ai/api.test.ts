import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamAiReply } from './api'
import { AI_PROVIDER_MODEL } from './constants'
import { DEFAULT_AI_SETTINGS } from './types'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('streamAiReply', () => {
  it('sends the Intelli AI question contract without a server chat id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ answer: 'A combined answer.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))
    vi.stubGlobal('fetch', fetchMock)
    const events: Array<{ type: 'status' | 'token'; text: string }> = []

    await streamAiReply({
      chatId: 'local-chat-id',
      message: 'Write a lesson outline',
      history: [
        { id: 'old-user', role: 'user', content: 'Earlier question', createdAt: '2026-01-01' },
        { id: 'old-assistant', role: 'assistant', content: 'Earlier answer', createdAt: '2026-01-01' },
        { id: 'current-user', role: 'user', content: 'Write a lesson outline', createdAt: '2026-01-01' },
      ],
      context: 'Scheme Books',
      model: AI_PROVIDER_MODEL,
      settings: { ...DEFAULT_AI_SETTINGS, subject: 'Mathematics', grade: 'Grade 5' },
      webSearch: false,
      plugins: [],
      files: [],
    }, (event) => events.push(event), new AbortController().signal)

    expect(fetchMock).toHaveBeenCalledWith('/api/ai/ask', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        question: 'Write a lesson outline',
        context: 'Scheme Books\nSubject: Mathematics\nGrade: Grade 5\nLanguage: English\nTone: Friendly',
        history: [
          { role: 'user', text: 'Earlier question' },
          { role: 'assistant', text: 'Earlier answer' },
        ],
      }),
    }))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('chatId')
    expect(events.at(-1)).toEqual({ type: 'token', text: 'A combined answer.' })
  })

  it('surfaces provider API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: 'No provider is configured.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )))

    await expect(streamAiReply({
      chatId: 'local-chat-id',
      message: 'Question',
      history: [],
      context: '',
      model: AI_PROVIDER_MODEL,
      settings: DEFAULT_AI_SETTINGS,
      webSearch: false,
      plugins: [],
      files: [],
    }, () => undefined, new AbortController().signal)).rejects.toThrow('No provider is configured.')
  })
})
