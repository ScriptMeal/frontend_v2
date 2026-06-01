import { useState, useCallback } from 'react'
import { streamChat } from '@/api/chat'
import { useSessionStore } from '@/store/sessionStore'
import { saveHistory } from '@/api/user'
import { toolToIntent } from '@/lib/intent'
import type { Intent } from '@/types'

export interface UseStreamReturn {
  isStreaming: boolean
  streamingText: string
  activeTool: string | null
  error: string | null
  send: (userMessage: string) => Promise<void>
}

export function useStream(): UseStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { currentSessionId, history, addMessage } = useSessionStore()

  const send = useCallback(
    async (userMessage: string) => {
      // API history 는 "이전 턴"만 — 현재 메시지를 추가하기 전 스냅샷을 캡처
      const historySnapshot = history

      setIsStreaming(true)
      setError(null)
      setStreamingText('')
      setActiveTool(null)

      // 낙관적 렌더: 전송 즉시 user 버블 노출
      addMessage({ role: 'user', content: userMessage })

      let accumulated = ''
      let intent: Intent = 'OFF_TOPIC'

      try {
        for await (const event of streamChat({
          message: userMessage,
          history: historySnapshot,
        })) {
          if (event.type === 'tool_start') {
            setActiveTool(event.tool ?? null)
            if (intent === 'OFF_TOPIC') intent = toolToIntent(event.tool)
          } else if (event.type === 'chunk') {
            accumulated += event.value ?? ''
            setStreamingText(accumulated)
            setActiveTool(null)
          } else if (event.type === 'done') {
            // 구매 정보(done.value)를 본문 말미에 인라인으로 합침
            const finalReply = accumulated + (event.value ?? '')
            addMessage({ role: 'assistant', content: finalReply })
            await saveHistory({
              session_id: currentSessionId,
              user_message: userMessage,
              recipe_reply: finalReply,
              intent,
            })
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '스트리밍 중 오류가 발생했습니다.')
      } finally {
        setIsStreaming(false)
        setActiveTool(null)
      }
    },
    [currentSessionId, history, addMessage],
  )

  return { isStreaming, streamingText, activeTool, error, send }
}
