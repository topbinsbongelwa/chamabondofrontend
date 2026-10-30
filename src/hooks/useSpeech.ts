import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionAlternativeLike {
  transcript: string
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<SpeechRecognitionAlternativeLike>>
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

export function useSpeech(onTranscript: (text: string) => void) {
  const [recording, setRecording] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    const speechWindow = window as SpeechWindow
    setSupported(Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition))
    return () => recognitionRef.current?.stop()
  }, [])

  const toggleRecording = useCallback((language = 'en') => {
    const speechWindow = window as SpeechWindow
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Recognition) return
    if (recording) {
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setRecording(false)
      return
    }
    const recognition = new Recognition()
    recognitionRef.current = recognition
    recognition.lang = language
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join('')
      onTranscript(transcript)
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setRecording(false)
    }
    recognition.onerror = () => {
      recognitionRef.current = null
      setRecording(false)
    }
    recognition.start()
    setRecording(true)
  }, [onTranscript, recording])

  return { recording, supported, toggleRecording }
}
