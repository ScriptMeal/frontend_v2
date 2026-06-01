import { useState, useCallback } from 'react'
import { streamChat } from '@/api/chat'
import { useSessionStore } from '@/store/sessionStore'
import { saveHistory } from '@/api/user'
import type { Message } from '@/types'

interface UseStreamReturn {
  isStreaming: boolean
  streamingText: string
  purchaseInfo: string | null
  activeTool: string | null
  send: (userMessage: string) => Promise<void>
}

export function useStream(): UseStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [purchaseInfo, setPurchaseInfo] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const { currentSessionId, history, addMessage } = useSessionStore()

  const send = useCallback(
    async (userMessage: string) => {
      setIsStreaming(true)
      setStreamingText('')
      setPurchaseInfo(null)
      setActiveTool(null)

      let accumulated = ''

      try {
        for await (const event of streamChat({
          message: userMessage,
          history,
          session_id: currentSessionId,
        })) {
          if (event.type === 'tool_start') {
            setActiveTool(event.tool ?? null)
          } else if (event.type === 'chunk') {
            accumulated += event.value ?? ''
            setStreamingText(accumulated)
            setActiveTool(null)
          } else if (event.type === 'done') {
            setPurchaseInfo(event.value ?? null)

            const userMsg: Message = { role: 'user', content: userMessage }
            const assistantMsg: Message = { role: 'assistant', content: accumulated }
            addMessage(userMsg)
            addMessage(assistantMsg)

            await saveHistory({
              session_id: currentSessionId,
              user_message: userMessage,
              assistant_reply: accumulated,
            })
          }
        }
      } finally {
        setIsStreaming(false)
      }
    },
    [currentSessionId, history, addMessage],
  )

  return { isStreaming, streamingText, purchaseInfo, activeTool, send }
}
