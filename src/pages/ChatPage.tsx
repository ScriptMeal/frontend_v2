import { useEffect, useMemo } from 'react'
import ChatView from '@/components/chat/ChatView'
import { useStream } from '@/hooks/useStream'
import { useHistory } from '@/hooks/useHistory'
import { useSessionStore } from '@/store/sessionStore'
import { recordToMessages } from '@/lib/recordToMessages'

export default function ChatPage() {
  const readOnly = useSessionStore((s) => s.readOnly)
  const currentSessionId = useSessionStore((s) => s.currentSessionId)

  // 훅 호출 규칙상 모드별로 컴포넌트를 분리한다(조건부 훅 호출 금지).
  if (readOnly) return <ReadOnlyChat sessionId={currentSessionId} />
  return <LiveChat />
}

/** 라이브 세션 — 메모리 history + 실시간 스트리밍 */
function LiveChat() {
  const history = useSessionStore((s) => s.history)
  const pendingMessage = useSessionStore((s) => s.pendingMessage)
  const clearPendingMessage = useSessionStore((s) => s.clearPendingMessage)
  const { isStreaming, streamingText, activeTool, error, send } = useStream()

  // 홈→채팅 핸드오프: 진입 시 대기 메시지를 캡처해 비운 뒤 1회만 전송
  useEffect(() => {
    if (!pendingMessage) return
    const captured = pendingMessage
    clearPendingMessage()
    void send(captured)
  }, [pendingMessage, clearPendingMessage, send])

  return (
    <ChatView
      history={history}
      isStreaming={isStreaming}
      streamingText={streamingText}
      activeTool={activeTool}
      error={error}
      onSend={send}
    />
  )
}

/** 과거 세션 — GET /api/history 로드 후 읽기 전용 렌더 */
function ReadOnlyChat({ sessionId }: { sessionId: string }) {
  const { data, isLoading, isError } = useHistory(sessionId)
  const messages = useMemo(() => recordToMessages(data ?? []), [data])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        대화 기록을 불러오는 중…
      </div>
    )
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex h-full items-center justify-center text-sm text-destructive"
      >
        대화 기록을 불러오지 못했습니다.
      </div>
    )
  }

  return <ChatView history={messages} readOnly />
}
