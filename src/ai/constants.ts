export const AI_SUGGESTIONS = [
  'Plan a Grade 5 maths lesson',
  'Draft a parent letter',
  "Summarise this week's attendance",
  'Explain photosynthesis simply',
]

export const AI_TONES = ['Friendly', 'Professional', 'Concise', 'Detailed'] as const
export const AI_UPLOAD_LIMIT = 10 * 1024 * 1024
export const AI_UPLOAD_ACCEPT =
  '.pdf,.doc,.docx,image/*'

export const AI_MOCK_ENABLED = import.meta.env.VITE_AI_MOCK === 'true'
