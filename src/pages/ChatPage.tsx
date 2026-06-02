import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import ChatView, { type FavoriteTurn } from '@/components/chat/ChatView'
import StateMessage from '@/components/common/StateMessage'
import { useStream } from '@/hooks/useStream'
import { useHistory } from '@/hooks/useHistory'
import { useSaveFavorite } from '@/hooks/useFavorites'
import { useSessionStore } from '@/store/sessionStore'
import { recordToMessages } from '@/lib/recordToMessages'

/** 즐겨찾기 저장 핸들러 — 현재 세션 id 로 턴을 저장한다 */
function useFavoriteHandler(sessionId: string) {
  const saveFavorite = useSaveFavorite()
  return (turn: FavoriteTurn) => saveFavorite.mutate({ session_id: sessionId, ...turn })
}

export default function ChatPage() {
  // 모드는 URL 로 판정한다: `/chat/:sessionId` 면 읽기 전용, `/chat` 이면 라이브.
  // 훅 호출 규칙상 모드별로 컴포넌트를 분리한다(조건부 훅 호출 금지).
  const { sessionId } = useParams<{ sessionId?: string }>()

  if (sessionId) return <ReadOnlyChat sessionId={sessionId} />
  return <LiveChat />
}

/** 라이브 세션 — 메모리 history + 실시간 스트리밍 */
function LiveChat() {
  const history = useSessionStore((s) => s.history)
  const currentSessionId = useSessionStore((s) => s.currentSessionId)
  const consumePendingMessage = useSessionStore((s) => s.consumePendingMessage)
  const { isStreaming, streamingText, activeTool, error, send } = useStream()
  const onFavorite = useFavoriteHandler(currentSessionId)

  // 홈→채팅 핸드오프: 진입 시 대기 메시지를 원자적으로 읽고 비운 뒤 1회만 전송.
  // StrictMode(개발) 가 effect 를 이중 호출해도 두 번째엔 스토어가 비어 null 을 받아 재전송하지 않는다.
  useEffect(() => {
    const captured = consumePendingMessage()
    if (captured) void send(captured)
  }, [consumePendingMessage, send])

  return (
    <ChatView
      history={history}
      isStreaming={isStreaming}
      streamingText={streamingText}
      activeTool={activeTool}
      error={error}
      onSend={send}
      onFavorite={onFavorite}
    />
  )
}

/** 과거 세션 — GET /api/history 로드 후 읽기 전용 렌더 */
function ReadOnlyChat({ sessionId }: { sessionId: string }) {
  const { data, isLoading, isError } = useHistory(sessionId)
  const messages = useMemo(() => recordToMessages(data ?? []), [data])
  const onFavorite = useFavoriteHandler(sessionId)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <StateMessage variant="loading">대화 기록을 불러오는 중…</StateMessage>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <StateMessage variant="error">대화 기록을 불러오지 못했습니다.</StateMessage>
      </div>
    )
  }

  return <ChatView history={messages} readOnly onFavorite={onFavorite} />
}
