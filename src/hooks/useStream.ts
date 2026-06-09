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

  const { currentSessionId, history, addMessage, addSession, recordHistoryId } = useSessionStore()

  const send = useCallback(
    async (userMessage: string) => {
      // API history 는 "이전 턴"만 — 현재 메시지를 추가하기 전 스냅샷을 캡처
      const historySnapshot = history
      // 첫 턴이면(이전 기록 없음) 저장 성공 후 사이드바 세션 목록에 등록
      const isFirstTurn = historySnapshot.length === 0
      // 이번 턴 assistant 버블의 index: 스냅샷 뒤로 user(+1)·assistant 순서로 추가되므로 +1.
      // 동시 전송이 끼어들어도 append-only라 기존 index 가 밀리지 않아 이 값은 불변이다.
      const assistantIndex = historySnapshot.length + 1

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
          // 요청 history 는 role·content 만 전송(intent 등 로컬 메타 제외)
          history: historySnapshot.map(({ role, content }) => ({ role, content })),
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
            // history 에 확정 버블을 추가하는 즉시, 임시 스트리밍 버블을 끈다.
            // 이 정리를 await saveHistory 뒤(finally)로 미루면, 네트워크 대기 동안
            // 확정 버블 + 임시 버블이 동시에 렌더돼 말풍선이 잠깐 2개로 보인다.
            // (.claude/debugging/20260608-chat-double-bubble.md 참고)
            addMessage({ role: 'assistant', content: finalReply, intent })
            setIsStreaming(false)
            setStreamingText('')
            const saved = await saveHistory({
              session_id: currentSessionId,
              user_message: userMessage,
              recipe_reply: finalReply,
              intent,
            })
            // history_id 기록은 반드시 여기(await 이후)서만 — isStreaming 은 이미 false 라
            // 임시 버블 조건이 꺼져 있어 슬라이스 갱신 리렌더가 이중 버블을 만들지 않는다.
            if (saved) recordHistoryId(assistantIndex, saved.id)
            if (isFirstTurn) {
              addSession({
                id: currentSessionId,
                createdAt: new Date().toISOString(),
                preview: userMessage,
              })
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '스트리밍 중 오류가 발생했습니다.')
      } finally {
        // done 경로에선 이미 위에서 정리됨. 에러 경로(스트림 실패)를 위한 안전망.
        setIsStreaming(false)
        setActiveTool(null)
      }
    },
    [currentSessionId, history, addMessage, addSession, recordHistoryId, streamChat, saveHistory],
  )

  return { isStreaming, streamingText, activeTool, error, send }
}
