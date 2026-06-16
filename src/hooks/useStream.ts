import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { streamChat as defaultStreamChat } from '@/api/chat'
import { useSessionStore } from '@/store/sessionStore'
import { saveHistory as defaultSaveHistory } from '@/api/user'
import { toolToIntent } from '@/lib/intent'
import type { HistoryRecord, Intent } from '@/types'

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

  const queryClient = useQueryClient()
  const { currentSessionId, history, addMessage, addSession, recordHistoryId } = useSessionStore()

  const send = useCallback(
    async (userMessage: string) => {
      // 이 스트림이 시작된 세션(origin)을 캡처한다. done 이 네트워크 지연만큼 뒤로 밀리는 동안
      // 사용자가 다른 세션으로 이동하면 store 의 currentSessionId 는 바뀌므로, 라이브 화면(store)
      // 반영은 "여전히 origin 세션일 때만" 한다. 서버 저장(saveHistory)·사이드바·캐시는 origin
      // 기준으로 수행해, A 의 응답이 B 화면에 새어 들지 않게 한다(재진입/새로고침 시 재하이드레이션으로 표시).
      const originSessionId = currentSessionId
      // API history 는 "이전 턴"만 — 현재 메시지를 추가하기 전 스냅샷을 캡처
      const historySnapshot = history
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
            // 단, 그 사이 다른 세션으로 이동했다면(현재 ≠ origin) 라이브 history 에 섞지 않는다.
            if (useSessionStore.getState().currentSessionId === originSessionId) {
              addMessage({ role: 'assistant', content: finalReply, intent })
            }
            setIsStreaming(false)
            setStreamingText('')
            const saved = await saveHistory({
              session_id: originSessionId,
              user_message: userMessage,
              recipe_reply: finalReply,
              intent,
            })
            // history_id 기록은 반드시 여기(await 이후)서만 — isStreaming 은 이미 false 라
            // 임시 버블 조건이 꺼져 있어 슬라이스 갱신 리렌더가 이중 버블을 만들지 않는다.
            if (saved) {
              // 저장 await 동안에도 세션이 바뀔 수 있으므로 다시 확인 후에만 라이브 historyIds 기록.
              if (useSessionStore.getState().currentSessionId === originSessionId) {
                recordHistoryId(assistantIndex, saved.id)
              }
              // 저장분을 history 캐시에 prepend(최신순) — 세션을 떠났다 돌아오거나 새로고침해
              // 재하이드레이션할 때 방금 친 턴이 빠지지 않도록 사본을 최신으로 유지한다(A안 보강책 ②).
              // 캐시는 세션 키별로 분리돼 있어 origin 키에 갱신하면 현재 세션과 무관하게 안전하다.
              queryClient.setQueryData<HistoryRecord[]>(['history', originSessionId], (old) => [
                saved,
                ...(old ?? []),
              ])
            }
            // 매 턴 세션을 upsert — 첫 턴이면 등록, 이어쓰기면 사이드바 최상단으로 이동 +
            // preview 를 최신 user 메시지로 갱신한다(최근 활동 순). addSession 이 id 중복을 막는다.
            addSession({
              id: originSessionId,
              createdAt: new Date().toISOString(),
              preview: userMessage,
            })
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
    [
      currentSessionId,
      history,
      addMessage,
      addSession,
      recordHistoryId,
      streamChat,
      saveHistory,
      queryClient,
    ],
  )

  return { isStreaming, streamingText, activeTool, error, send }
}
