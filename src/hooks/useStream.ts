import { useState, useCallback } from 'react'
import { streamChat as defaultStreamChat } from '@/api/chat'
import { useSessionStore } from '@/store/sessionStore'
import { saveHistory as defaultSaveHistory } from '@/api/user'
import { toolToIntent } from '@/lib/intent'
import type { Intent } from '@/types'

export interface UseStreamReturn {
  isStreaming: boolean
  streamingText: string
  activeTool: string | null
  error: string | null
  send: (userMessage: string) => Promise<void>
}

/**
 * 의존성 주입(선택) — 기본은 실제 API.
 * mock 스트림으로 UI 를 검증할 때 `useStream({ streamChat: mockStreamChat })` 처럼 주입한다.
 */
export interface UseStreamDeps {
  streamChat?: typeof defaultStreamChat
  saveHistory?: typeof defaultSaveHistory
}

export function useStream(deps: UseStreamDeps = {}): UseStreamReturn {
  const streamChat = deps.streamChat ?? defaultStreamChat
  const saveHistory = deps.saveHistory ?? defaultSaveHistory
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
    [currentSessionId, history, addMessage, streamChat, saveHistory],
  )

  return { isStreaming, streamingText, activeTool, error, send }
}
