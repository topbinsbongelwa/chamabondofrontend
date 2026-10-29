const DEFAULT_INTELLI_AI_API_URL = 'https://intellli-ai.netlify.app/api/ask'
const MAX_QUESTION_LENGTH = 10_000
const MAX_CONTEXT_LENGTH = 4_000
const MAX_HISTORY_ITEMS = 30
const MAX_HISTORY_TEXT_LENGTH = 8_000

function sendJson(response, status, body) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

function getUpstreamUrl() {
  const configuredUrl = process.env.INTELLI_AI_API_URL?.trim() || DEFAULT_INTELLI_AI_API_URL
  const url = new URL(configuredUrl)

  if (url.pathname.endsWith('/edu/ask')) {
    url.pathname = '/api/ask'
  } else if (!url.pathname.endsWith('/api/ask')) {
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/api/ask`
  }

  url.search = ''
  url.hash = ''
  return url.toString()
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return sendJson(response, 405, { error: 'Method not allowed.' })
  }

  let body = request.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return sendJson(response, 400, { error: 'The request body must be valid JSON.' })
    }
  }

  const question = typeof body?.question === 'string' ? body.question.trim() : ''
  if (!question) return sendJson(response, 400, { error: 'A non-empty question is required.' })
  if (question.length > MAX_QUESTION_LENGTH) {
    return sendJson(response, 413, { error: 'The question is too long.' })
  }

  const context = typeof body.context === 'string' ? body.context.slice(0, MAX_CONTEXT_LENGTH) : ''
  const history = Array.isArray(body.history)
    ? body.history.slice(-MAX_HISTORY_ITEMS).flatMap((item) => {
      if (!item || !['user', 'assistant'].includes(item.role) || typeof item.text !== 'string') return []
      return [{ role: item.role, text: item.text.slice(0, MAX_HISTORY_TEXT_LENGTH) }]
    })
    : []

  try {
    const upstream = await fetch(getUpstreamUrl(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context, history }),
    })
    const responseBody = await upstream.text()
    response.statusCode = upstream.status
    response.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') || 'application/json; charset=utf-8',
    )
    response.setHeader('Cache-Control', 'no-store')
    return response.end(responseBody)
  } catch {
    return sendJson(response, 502, { error: 'Could not reach Intelli AI. Please try again.' })
  }
}
